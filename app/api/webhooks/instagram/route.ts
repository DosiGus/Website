import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServerClient";
import {
  verifyWebhookSignature,
  verifySubscriptionToken,
} from "../../../../lib/meta/webhookVerify";
import {
  InstagramWebhookPayload,
  InstagramMessagingEvent,
} from "../../../../lib/meta/types";
import {
  sendInstagramMessage,
  sendInstagramMessageWithImage,
} from "../../../../lib/meta/instagramApi";
import { findMatchingFlow, parseQuickReplyPayload } from "../../../../lib/webhook/flowMatcher";
import { executeFlowNode, handleQuickReplySelection, handleFreeTextInput } from "../../../../lib/webhook/flowExecutor";
import { logger, createRequestLogger } from "../../../../lib/logger";
import {
  extractVariables,
  extractName,
  extractDate,
  extractTime,
  extractGuestCount,
  mergeVariables,
  ExtractedVariables,
} from "../../../../lib/webhook/variableExtractor";
import { ConversationMetadata } from "../../../../lib/flowTypes";
import {
  canCreateReservation,
  createReservationFromVariables,
  getMissingReservationFields,
} from "../../../../lib/webhook/reservationCreator";
import {
  findOrCreateContact,
  updateContactDisplayName,
  touchContact,
} from "../../../../lib/contacts";

function extractReviewRating(text: string): number | null {
  if (!text) return null;
  const digitMatch = text.match(/([1-5])/);
  if (digitMatch) {
    return Number.parseInt(digitMatch[1], 10);
  }
  const starMatches = text.match(/⭐/g);
  if (starMatches && starMatches.length > 0 && starMatches.length <= 5) {
    return starMatches.length;
  }
  return null;
}

async function updateReviewRequestFromMessage(params: {
  supabase: ReturnType<typeof createSupabaseServerClient>;
  reqLogger: ReturnType<typeof createRequestLogger>;
  reviewRequestId: string;
  rating?: number;
  feedbackText?: string;
}) {
  const { supabase, reqLogger, reviewRequestId, rating, feedbackText } = params;
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof rating === "number") {
    updates.rating = rating;
    updates.rated_at = new Date().toISOString();
    updates.status = rating <= 2 ? "rated" : "completed";
  }

  if (feedbackText) {
    updates.feedback_text = feedbackText;
    updates.feedback_at = new Date().toISOString();
    updates.status = "completed";
  }

  const { error } = await supabase
    .from("review_requests")
    .update(updates)
    .eq("id", reviewRequestId);

  if (error) {
    await reqLogger.error("webhook", `Failed to update review request: ${error.message}`);
  }
}
/**
 * GET: Webhook subscription verification from Meta.
 * Meta sends: hub.mode, hub.verify_token, hub.challenge
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  await logger.info("webhook", "Webhook verification request received", {
    metadata: { mode, hasToken: !!token, hasChallenge: !!challenge },
  });

  if (mode === "subscribe" && verifySubscriptionToken(token)) {
    await logger.info("webhook", "Webhook verification successful");
    // Return challenge as plain text
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  await logger.warn("webhook", "Webhook verification failed", {
    metadata: { mode, tokenValid: verifySubscriptionToken(token) },
  });

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * POST: Receive incoming messages from Instagram.
 */
export async function POST(request: Request) {
  const reqLogger = createRequestLogger("webhook");

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      await reqLogger.warn("webhook", "Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse payload
    const payload: InstagramWebhookPayload = JSON.parse(rawBody);
    const entrySummaries = Array.isArray(payload?.entry)
      ? payload.entry.slice(0, 3).map((entry) => {
          const messaging = (entry as { messaging?: unknown }).messaging;
          const changes = (entry as { changes?: unknown }).changes;
          return {
            id: entry.id,
            keys: Object.keys(entry ?? {}),
            messagingCount: Array.isArray(messaging) ? messaging.length : 0,
            changesCount: Array.isArray(changes) ? changes.length : 0,
          };
        })
      : [];
    const hasMessagingEvents = entrySummaries.some(
      (summary) => summary.messagingCount > 0,
    );
    if (!hasMessagingEvents) {
      await reqLogger.warn("webhook", "Webhook payload has no messaging events", {
        metadata: {
          object: payload?.object,
          entryCount: Array.isArray(payload?.entry) ? payload.entry.length : 0,
          entrySummaries,
        },
      });
    }

    // Only process Instagram events
    if (payload.object !== "instagram") {
      await reqLogger.info("webhook", `Ignoring non-Instagram event: ${payload.object}`);
      return NextResponse.json({ received: true });
    }

    // Process each entry
    for (const entry of payload.entry) {
      for (const event of entry.messaging || []) {
        await processMessagingEvent(event, entry.id, reqLogger);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await reqLogger.logError("webhook", error, "Webhook processing failed");
    // Always return 200 to Meta to prevent retries
    return NextResponse.json({ received: true });
  }
}

/**
 * Process a single messaging event from Instagram.
 */
async function processMessagingEvent(
  event: InstagramMessagingEvent,
  instagramAccountId: string,
  reqLogger: ReturnType<typeof createRequestLogger>
) {
  const supabase = createSupabaseServerClient();
  const senderId = event.sender.id;
  const recipientId = event.recipient.id;

  // Ignore messages sent by ourselves (echo)
  if (senderId === instagramAccountId) {
    return;
  }

  await reqLogger.info("webhook", "Processing messaging event", {
    metadata: {
      senderId,
      recipientId,
      instagramAccountId,
      hasMessage: !!event.message,
      hasPostback: !!event.postback,
    },
  });

  // Find the integration by Instagram account ID
  const { data: integration, error: integrationError } = await supabase
    .from("integrations")
    .select("id, user_id, account_id, access_token")
    .eq("instagram_id", instagramAccountId)
    .eq("status", "connected")
    .single();

  if (integrationError || !integration) {
    await reqLogger.warn("webhook", `No integration found for Instagram ID: ${instagramAccountId}`);
    return;
  }

  const userId = integration.user_id;
  const accountId = integration.account_id;
  const accessToken = integration.access_token;

  if (!accessToken) {
    await reqLogger.error("webhook", "Integration has no access token");
    return;
  }

  let contactId: string | null = null;
  try {
    const contact = await findOrCreateContact(
      accountId,
      "instagram_dm",
      senderId
    );
    contactId = contact.contactId;
  } catch (error) {
    await reqLogger.warn("webhook", "Failed to resolve contact", {
      metadata: {
        accountId,
        senderId,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  // Get or create conversation
  let { data: conversation } = await supabase
    .from("conversations")
    .select("id, current_flow_id, current_node_id, metadata, contact_id, channel_sender_id")
    .eq("integration_id", integration.id)
    .eq("instagram_sender_id", senderId)
    .single();

  if (!conversation) {
    const { data: newConversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        account_id: accountId,
        integration_id: integration.id,
        contact_id: contactId,
        instagram_sender_id: senderId,
        channel: "instagram_dm",
        channel_sender_id: senderId,
        status: "active",
        metadata: {},
      })
      .select("id, current_flow_id, current_node_id, metadata, contact_id, channel_sender_id")
      .single();

    if (convError) {
      await reqLogger.error("webhook", `Failed to create conversation: ${convError.message}`);
      return;
    }

    conversation = newConversation;
  } else if (contactId && !conversation.contact_id) {
    const { error: contactUpdateError } = await supabase
      .from("conversations")
      .update({
        contact_id: contactId,
        channel: "instagram_dm",
        channel_sender_id: senderId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    if (contactUpdateError) {
      await reqLogger.warn("webhook", "Failed to backfill contact on conversation", {
        metadata: {
          conversationId: conversation.id,
          contactId,
          error: contactUpdateError.message,
        },
      });
    }
  }

  // Extract message content
  let messageText = "";
  let quickReplyPayload: string | null = null;
  let messageType: "text" | "quick_reply" | "image" = "text";
  let instagramMessageId: string | null = null;

  if (event.message) {
    instagramMessageId = event.message.mid;
    messageText = event.message.text || "";

    if (event.message.quick_reply) {
      quickReplyPayload = event.message.quick_reply.payload;
      messageType = "quick_reply";
    } else if (event.message.attachments?.length) {
      messageType = "image";
    }
  } else if (event.postback) {
    instagramMessageId = event.postback.mid;
    quickReplyPayload = event.postback.payload;
    messageType = "quick_reply";
  }

  // Extract and merge variables from the incoming message
  // NOTE: This is mutable because it may be reset when a new flow starts
  let existingMetadata = (conversation.metadata || {}) as ConversationMetadata;
  let existingVariables = existingMetadata.variables || {};

  // Extract variables from the message text
  // NOTE: We only extract name when explicitly asked (at ask-name node)
  // to avoid capturing trigger messages like "Hallo" or "Reservieren" as names
  let newVariables: ExtractedVariables = {};
  if (messageText) {
    // Try general extraction first (date, time, phone, email, guestCount)
    newVariables = extractVariables(messageText, {});

    // DO NOT extract name automatically from every message!
    // Names are only extracted when the current node is asking for a name (see overrides below)

    // Extract specific fields if not already present
    if (!existingVariables.date && !newVariables.date) {
      const extractedDate = extractDate(messageText);
      if (extractedDate) {
        newVariables.date = extractedDate;
      }
    }

    if (!existingVariables.time && !newVariables.time) {
      const extractedTime = extractTime(messageText);
      if (extractedTime) {
        newVariables.time = extractedTime;
      }
    }

    if (!existingVariables.guestCount && !newVariables.guestCount) {
      const extractedCount = extractGuestCount(messageText);
      if (extractedCount) {
        newVariables.guestCount = extractedCount;
      }
    }
  }

  // Merge new variables with existing ones
  let mergedVariables = mergeVariables(existingVariables, newVariables);

  // Allow overriding specific fields when the user is answering a targeted question
  const overrideVariables: ExtractedVariables = {};
  if (messageText && conversation.current_node_id) {
    const nodeKey = conversation.current_node_id.toLowerCase();
    const trimmedMessage = messageText.trim();

    // When asking for name: use the entire message as the name
    // (user is expected to just type their name)
    if (nodeKey.includes("name")) {
      // First try structured extraction
      const extractedName = extractName(trimmedMessage);
      if (extractedName) {
        overrideVariables.name = extractedName;
      } else if (trimmedMessage.length > 0 && trimmedMessage.length < 100) {
        // If no structured name found, use the whole message as name
        // (as long as it's reasonable length)
        overrideVariables.name = trimmedMessage;
      }
    }

    if (nodeKey.includes("date")) {
      const extractedDate = extractDate(trimmedMessage);
      if (extractedDate) overrideVariables.date = extractedDate;
    }

    if (nodeKey.includes("time")) {
      const extractedTime = extractTime(trimmedMessage);
      if (extractedTime) overrideVariables.time = extractedTime;
    }

    if (nodeKey.includes("guest")) {
      const extractedCount = extractGuestCount(trimmedMessage);
      if (extractedCount) overrideVariables.guestCount = extractedCount;
    }

    // When asking for phone: accept direct phone number input
    // Clean up the number (remove spaces, dashes) and use it
    if (nodeKey.includes("phone") || nodeKey.includes("telefon") || nodeKey.includes("nummer")) {
      // First try structured extraction
      const extractedPhone = extractVariables(trimmedMessage, {}).phone;
      if (extractedPhone) {
        overrideVariables.phone = extractedPhone;
      } else {
        // If no structured phone found, try to clean the message as a phone number
        const cleanedPhone = trimmedMessage.replace(/[\s\-\/\(\)]/g, "");
        // Check if it looks like a phone number (mostly digits, maybe starting with +)
        if (/^\+?[\d]{6,15}$/.test(cleanedPhone)) {
          overrideVariables.phone = cleanedPhone;
        }
      }
    }

    // When asking for special requests/wishes: use the entire message
    if (nodeKey.includes("special") || nodeKey.includes("wunsch") || nodeKey.includes("wünsch") || nodeKey.includes("notes") || nodeKey.includes("notiz")) {
      if (trimmedMessage.length > 0) {
        overrideVariables.specialRequests = trimmedMessage;
      }
    }

    // Review flow: capture rating and feedback
    if (nodeKey.includes("review-rating")) {
      const rating = extractReviewRating(trimmedMessage);
      if (rating) {
        overrideVariables.reviewRating = rating;
      }
    }

    if (nodeKey.includes("review-feedback")) {
      if (trimmedMessage.length > 0) {
        overrideVariables.reviewFeedback = trimmedMessage;
      }
    }
  }

  const hasOverrides = Object.keys(overrideVariables).length > 0;
  if (hasOverrides) {
    mergedVariables = { ...mergedVariables, ...overrideVariables };
  }

  if (contactId && typeof mergedVariables.name === "string") {
    try {
      await updateContactDisplayName(contactId, mergedVariables.name);
    } catch (error) {
      await reqLogger.warn("webhook", "Failed to update contact display name", {
        metadata: {
          contactId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  // Update metadata if new variables were extracted or overridden
  if (Object.keys(newVariables).length > 0 || hasOverrides) {
    const updatedMetadata: ConversationMetadata = {
      ...existingMetadata,
      variables: mergedVariables,
    };

    const { error: metaUpdateError } = await supabase
      .from("conversations")
      .update({ metadata: updatedMetadata })
      .eq("id", conversation.id);

    if (metaUpdateError) {
      await reqLogger.error("webhook", `Failed to update conversation metadata: ${metaUpdateError.message}`);
    }

    await reqLogger.info("webhook", "Variables extracted from message", {
      metadata: { newVariables, overrideVariables, mergedVariables },
    });
  }

  const reviewRating = typeof overrideVariables.reviewRating === "number" ? overrideVariables.reviewRating : null;
  const reviewFeedback =
    typeof overrideVariables.reviewFeedback === "string" ? overrideVariables.reviewFeedback : null;

  if (reviewRating !== null || reviewFeedback) {
    let reviewRequestId =
      typeof existingMetadata.reviewRequestId === "string"
        ? existingMetadata.reviewRequestId
        : null;

    if (!reviewRequestId) {
      const { data: latestReview } = await supabase
        .from("review_requests")
        .select("id")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      reviewRequestId = latestReview?.id ?? null;
    }

    if (reviewRequestId) {
      await updateReviewRequestFromMessage({
        supabase,
        reqLogger,
        reviewRequestId,
        rating: reviewRating ?? undefined,
        feedbackText: reviewFeedback ?? undefined,
      });
    }
  }

  // Check for duplicate message (idempotency)
  if (instagramMessageId) {
    const { data: existingMessage } = await supabase
      .from("messages")
      .select("id")
      .eq("instagram_message_id", instagramMessageId)
      .single();

    if (existingMessage) {
      await reqLogger.info("webhook", "Duplicate message, skipping", {
        metadata: { instagramMessageId },
      });
      return;
    }
  }

  // Save incoming message
  const { error: incomingMsgError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    direction: "incoming",
    message_type: messageType,
    content: messageText,
    quick_reply_payload: quickReplyPayload,
    instagram_message_id: instagramMessageId,
    channel_message_id: instagramMessageId,
    flow_id: conversation.current_flow_id,
    node_id: conversation.current_node_id,
  });

  if (incomingMsgError) {
    await reqLogger.error("webhook", `Failed to save incoming message: ${incomingMsgError.message}`);
  }

  if (contactId) {
    try {
      await touchContact(contactId);
    } catch (error) {
      await reqLogger.warn("webhook", "Failed to update contact last_seen", {
        metadata: {
          contactId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  // Determine response
  let flowResponse = null;
  let matchedFlowId: string | null = conversation.current_flow_id;
  let matchedNodeId: string | null = null;

  // Handle quick reply continuation
  if (quickReplyPayload && conversation.current_flow_id) {
    const parsed = parseQuickReplyPayload(quickReplyPayload);

    if (parsed) {
      // Load the flow
      const { data: flow } = await supabase
        .from("flows")
        .select("nodes, edges")
        .eq("id", parsed.flowId)
        .single();

      if (flow) {
        flowResponse = handleQuickReplySelection(
          quickReplyPayload,
          flow.nodes,
          flow.edges,
          parsed.flowId,
          mergedVariables
        );
        matchedFlowId = parsed.flowId;
        matchedNodeId = parsed.nodeId;
      }
    }
  }

  // If no quick reply match but user is in an active flow, try free text continuation
  if (!flowResponse && messageText && conversation.current_flow_id && conversation.current_node_id) {
    // Load the current flow
    const { data: currentFlow } = await supabase
      .from("flows")
      .select("nodes, edges")
      .eq("id", conversation.current_flow_id)
      .single();

    if (currentFlow) {
      const currentNode = Array.isArray(currentFlow.nodes)
        ? currentFlow.nodes.find(
            (node: any) => node.id === conversation.current_node_id
          )
        : null;
      const quickReplies = Array.isArray(currentNode?.data?.quickReplies)
        ? currentNode?.data?.quickReplies
        : [];
      const outgoingEdges = Array.isArray(currentFlow.edges)
        ? currentFlow.edges.filter(
            (edge: { source?: string }) => edge.source === conversation.current_node_id
          )
        : [];
      const expectsFreeText = quickReplies.length === 0 && outgoingEdges.length > 0;

      const freeTextResult = handleFreeTextInput(
        conversation.current_node_id,
        currentFlow.nodes,
        currentFlow.edges,
        conversation.current_flow_id,
        mergedVariables
      );

      if (freeTextResult) {
        flowResponse = freeTextResult.response;
        matchedFlowId = conversation.current_flow_id;
        matchedNodeId = freeTextResult.executedNodeId;

        await reqLogger.info("webhook", "Free text input processed, continuing flow", {
          metadata: {
            flowId: conversation.current_flow_id,
            fromNode: conversation.current_node_id,
            toNode: matchedNodeId,
            variables: mergedVariables,
          },
        });
      } else if (expectsFreeText) {
        await reqLogger.info("webhook", "Free text input did not continue flow", {
          metadata: {
            flowId: conversation.current_flow_id,
            currentNodeId: conversation.current_node_id,
            outgoingEdgeCount: outgoingEdges.length,
            hasQuickReplies: quickReplies.length > 0,
            variables: mergedVariables,
          },
        });
      }
    }
  }

  // If still no response, try to match a new flow
  if (!flowResponse && messageText) {
    // Handle special payloads for existing reservation management
    if (quickReplyPayload === "CANCEL_EXISTING_RESERVATION") {
      // User wants to cancel their existing reservation
      const { data: existingRes } = await supabase
        .from("reservations")
        .select("id, guest_name, reservation_date, reservation_time")
        .eq("instagram_sender_id", senderId)
        .eq("account_id", accountId)
        .in("status", ["pending", "confirmed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingRes) {
        const { error: cancelError } = await supabase
          .from("reservations")
          .update({ status: "cancelled" })
          .eq("id", existingRes.id);

        if (cancelError) {
          await reqLogger.error("webhook", `Failed to cancel reservation: ${cancelError.message}`);
        }

        const cancelText = `✅ Deine Reservierung wurde storniert.\n\nFalls du eine neue Reservierung machen möchtest, schreib einfach "Reservieren" oder "Tisch buchen".`;

        await sendInstagramMessage({
          recipientId: senderId,
          text: cancelText,
          quickReplies: [
            { label: "Neue Reservierung", payload: "NEUE_RESERVIERUNG" },
          ],
          accessToken,
        });

        await reqLogger.info("webhook", "Reservation cancelled by user", {
          metadata: { reservationId: existingRes.id },
        });
        return;
      }
    }

    if (quickReplyPayload === "KEEP_EXISTING_RESERVATION") {
      const keepText = `👍 Alles klar! Deine bestehende Reservierung bleibt unverändert.\n\nFalls du Fragen hast, schreib uns einfach!`;

      await sendInstagramMessage({
        recipientId: senderId,
        text: keepText,
        quickReplies: [],
        accessToken,
      });
      return;
    }

    // Check if user already has an active reservation (before starting a new flow)
    const forceNewReservation = quickReplyPayload === "NEUE_RESERVIERUNG" ||
                                 quickReplyPayload === "FORCE_NEW_RESERVATION";

    // If user clicked "Neue Reservierung", treat it as a reservation request
    if (forceNewReservation) {
      messageText = "reservieren"; // Trigger the reservation flow
      // Clear existing variables for fresh reservation
      mergedVariables = {};
      existingVariables = {};
      existingMetadata = {
        variables: {},
        reservationId: undefined,
        flowCompleted: undefined,
        reviewFlowId: undefined,
        reviewRequestId: undefined,
      };
      const { error: resetError1 } = await supabase
        .from("conversations")
        .update({ metadata: existingMetadata, current_flow_id: null, current_node_id: null })
        .eq("id", conversation.id);

      if (resetError1) {
        await reqLogger.error("webhook", `Failed to reset conversation for new reservation: ${resetError1.message}`);
      }

      await reqLogger.info("webhook", "User requested new reservation, metadata cleared", {
        metadata: { previousReservationId: existingMetadata.reservationId },
      });
    }

    if (!forceNewReservation) {
      const { data: existingReservation } = await supabase
        .from("reservations")
        .select("id, guest_name, reservation_date, reservation_time, guest_count, status")
        .eq("instagram_sender_id", senderId)
        .eq("account_id", accountId)
        .in("status", ["pending", "confirmed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingReservation) {
        // Format date for German display
        const [year, month, day] = existingReservation.reservation_date.split("-");
        const formattedDate = `${day}.${month}.${year}`;

        const existingResText = `📋 Du hast bereits eine aktive Reservierung:\n\n` +
          `👤 Name: ${existingReservation.guest_name}\n` +
          `📅 Datum: ${formattedDate}\n` +
          `⏰ Uhrzeit: ${existingReservation.reservation_time}\n` +
          `👥 Personen: ${existingReservation.guest_count}\n` +
          `📌 Status: ${existingReservation.status === "confirmed" ? "Bestätigt" : "Ausstehend"}\n\n` +
          `Was möchtest du tun?`;

        await sendInstagramMessage({
          recipientId: senderId,
          text: existingResText,
          quickReplies: [
            { label: "Stornieren", payload: "CANCEL_EXISTING_RESERVATION" },
            { label: "Behalten", payload: "KEEP_EXISTING_RESERVATION" },
            { label: "Neue Reservierung", payload: "FORCE_NEW_RESERVATION" },
          ],
          accessToken,
        });

        await reqLogger.info("webhook", "User has existing reservation, showing options", {
          metadata: {
            existingReservationId: existingReservation.id,
            status: existingReservation.status,
          },
        });
        return;
      }
    }

    const matchedFlow = await findMatchingFlow(accountId, messageText);

    if (matchedFlow) {
      // Reset variables and reservationId when starting a NEW flow
      // This ensures old reservation data doesn't block new reservations
      const previousReservationId = existingMetadata.reservationId;
      mergedVariables = {};
      existingVariables = {};
      existingMetadata = {
        variables: {},
        reservationId: undefined,
        flowCompleted: undefined,
        reviewFlowId: undefined,
        reviewRequestId: undefined,
      };
      const { error: resetError2 } = await supabase
        .from("conversations")
        .update({ metadata: existingMetadata, current_flow_id: null, current_node_id: null })
        .eq("id", conversation.id);

      if (resetError2) {
        await reqLogger.error("webhook", `Failed to reset conversation for new flow: ${resetError2.message}`);
      }

      await reqLogger.info("webhook", "New flow started, metadata reset", {
        metadata: {
          flowId: matchedFlow.flowId,
          flowName: matchedFlow.flowName,
          previousReservationId,
        },
      });

      flowResponse = executeFlowNode(
        matchedFlow.startNodeId,
        matchedFlow.nodes,
        matchedFlow.edges,
        matchedFlow.flowId,
        mergedVariables
      );
      matchedFlowId = matchedFlow.flowId;
      matchedNodeId = matchedFlow.startNodeId;

      await reqLogger.info("webhook", "Flow matched", {
        metadata: {
          flowId: matchedFlow.flowId,
          flowName: matchedFlow.flowName,
          triggerId: matchedFlow.triggerId,
          variables: mergedVariables,
        },
      });
    }
  }

  // Send response if we have one
  if (flowResponse) {
    let sendResult;

    if (flowResponse.imageUrl) {
      sendResult = await sendInstagramMessageWithImage({
        recipientId: senderId,
        imageUrl: flowResponse.imageUrl,
        text: flowResponse.text,
        quickReplies: flowResponse.quickReplies,
        accessToken,
      });
    } else {
      sendResult = await sendInstagramMessage({
        recipientId: senderId,
        text: flowResponse.text,
        quickReplies: flowResponse.quickReplies,
        accessToken,
      });
    }

    if (sendResult.success) {
      // Save outgoing message
      const { error: outgoingMsgError } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        direction: "outgoing",
        message_type: flowResponse.quickReplies.length > 0 ? "quick_reply" : "text",
        content: flowResponse.text,
        instagram_message_id: sendResult.data.message_id,
        channel_message_id: sendResult.data.message_id,
        flow_id: matchedFlowId,
        node_id: matchedNodeId,
      });

      if (outgoingMsgError) {
        await reqLogger.error("webhook", `Failed to save outgoing message: ${outgoingMsgError.message}`);
      }

      // Update conversation state
      const storedNodeId = flowResponse.isEndOfFlow ? null : matchedNodeId;
      const { error: convUpdateError } = await supabase
        .from("conversations")
        .update({
          current_flow_id: matchedFlowId,
          current_node_id: storedNodeId,
          last_message_at: new Date().toISOString(),
          status: flowResponse.isEndOfFlow ? "closed" : "active",
        })
        .eq("id", conversation.id);

      if (convUpdateError) {
        await reqLogger.error("webhook", `Failed to update conversation state: ${convUpdateError.message}`);
      }

      await reqLogger.info("webhook", "Response sent successfully", {
        metadata: {
          messageId: sendResult.data.message_id,
          flowId: matchedFlowId,
          nodeId: matchedNodeId,
          storedNodeId,
          nextNodeId: flowResponse.nextNodeId,
          expectsFreeText:
            !flowResponse.isEndOfFlow &&
            flowResponse.quickReplies.length === 0 &&
            Boolean(flowResponse.nextNodeId),
        },
      });

      const isReviewFlow =
        (matchedFlowId &&
          typeof existingMetadata?.reviewFlowId === "string" &&
          matchedFlowId === existingMetadata.reviewFlowId) ||
        (matchedNodeId && matchedNodeId.toLowerCase().startsWith("review-"));

      if (!isReviewFlow) {
        // Check if reservation actually exists in database (not just in metadata)
        // AND belongs to the current conversation AND is still active (pending/confirmed)
        let reservationAlreadyExists = false;
        if (existingMetadata?.reservationId) {
          const { data: existingReservation } = await supabase
            .from("reservations")
            .select("id, conversation_id, status")
            .eq("id", existingMetadata.reservationId)
            .single();

          // Only consider it "already exists" if:
          // 1. The reservation exists
          // 2. It belongs to THIS conversation
          // 3. It's still active (pending or confirmed)
          const isActiveReservation = Boolean(existingReservation &&
            existingReservation.conversation_id === conversation.id &&
            (existingReservation.status === "pending" || existingReservation.status === "confirmed"));

          reservationAlreadyExists = isActiveReservation;

          // If metadata has reservationId but reservation doesn't exist or is inactive, clean up metadata
          if (!isActiveReservation) {
            await reqLogger.info("webhook", "Cleaning up old/orphaned reservationId from metadata", {
              metadata: {
                oldReservationId: existingMetadata.reservationId,
                reason: !existingReservation ? "not_found" :
                        existingReservation.conversation_id !== conversation.id ? "wrong_conversation" : "inactive",
                preservedVariables: mergedVariables,
              },
            });
            const cleanedMetadata: ConversationMetadata = {
              ...existingMetadata,
              variables: mergedVariables,
              reservationId: undefined,
              flowCompleted: undefined,
            };
            const { error: cleanupError } = await supabase
              .from("conversations")
              .update({ metadata: cleanedMetadata })
              .eq("id", conversation.id);

            if (cleanupError) {
              await reqLogger.error("webhook", `Failed to cleanup orphaned metadata: ${cleanupError.message}`);
            }
          }
        }

        // Check if the current node is a confirmation node (multiple naming conventions)
        const confirmationNodeIds = [
          "confirmed",
          "confirmation",
          "bestätigung",
          "bestaetigung",
          "bestaetigt",
          "bestätigt",
          "abschluss",
          "fertig",
          "done",
          "complete",
          "end",
          "ende",
          "danke",
          "thanks",
          "thank",
          "success",
          "erfolgreich",
        ];
        const isConfirmationNode = matchedNodeId
          ? confirmationNodeIds.some(id =>
              matchedNodeId.toLowerCase().includes(id.toLowerCase())
            )
          : false;

        // Check if the quick reply payload indicates confirmation
        const confirmationPayloads = [
          "confirm",
          "bestätigen",
          "bestaetigen",
          "ja",
          "yes",
          "ok",
          "buchen",
          "reservieren",
          "absenden",
          "senden",
        ];
        const isConfirmationPayload = quickReplyPayload
          ? confirmationPayloads.some(p =>
              quickReplyPayload.toLowerCase().includes(p.toLowerCase())
            )
          : false;

        // Check if all required reservation data is present and this looks like a final step
        const hasAllReservationData = canCreateReservation(mergedVariables);

        // List of nodes that are still collecting data - don't create reservation here
        const dataCollectionNodes = [
          "ask-name", "ask-phone", "ask-special", "ask-date", "ask-time", "ask-guests",
          "ask-date-custom", "ask-time-custom", "ask-guests-large",
          "special-allergy", "special-occasion"
        ];
        const isDataCollectionNode = matchedNodeId
          ? dataCollectionNodes.some(n => matchedNodeId.toLowerCase().includes(n.toLowerCase().replace("ask-", "")))
          : false;

        // Only consider it a final step if the response text explicitly confirms the reservation
        // AND we're not at a data collection node
        const looksLikeFinalStep =
          hasAllReservationData &&
          !isDataCollectionNode &&
          flowResponse.isEndOfFlow ||
          (flowResponse.text &&
            !isDataCollectionNode &&
            (flowResponse.text.toLowerCase().includes("reservierung ist bestätigt") ||
              flowResponse.text.toLowerCase().includes("vielen dank") ||
              flowResponse.text.toLowerCase().includes("erfolgreich")));

        const shouldCreateReservation =
          !reservationAlreadyExists &&
          !isDataCollectionNode &&
          (flowResponse.isEndOfFlow ||
            isConfirmationNode ||
            isConfirmationPayload ||
            looksLikeFinalStep);

        // Log reservation check details for debugging
        await reqLogger.info("webhook", "Reservation check", {
          metadata: {
            reservationAlreadyExists,
            isEndOfFlow: flowResponse.isEndOfFlow,
            isConfirmationNode,
            isConfirmationPayload,
            looksLikeFinalStep,
            hasAllReservationData,
            matchedNodeId,
            quickReplyPayload,
            responseText: flowResponse.text?.slice(0, 100),
            shouldCreateReservation,
            canCreate: canCreateReservation(mergedVariables),
            missingFields: getMissingReservationFields(mergedVariables),
            variables: mergedVariables,
          },
        });

        if (shouldCreateReservation && canCreateReservation(mergedVariables)) {
          const reservationResult = await createReservationFromVariables(
            userId,
            accountId,
            conversation.id,
            matchedFlowId,
            mergedVariables,
            senderId,
            contactId ?? undefined
          );

          if (reservationResult.success) {
            // Update conversation metadata with reservation ID
            const finalMetadata: ConversationMetadata = {
              ...existingMetadata,
              variables: mergedVariables,
              reservationId: reservationResult.reservationId,
              flowCompleted: true,
            };

            const { error: finalMetaError } = await supabase
              .from("conversations")
              .update({ metadata: finalMetadata })
              .eq("id", conversation.id);

            if (finalMetaError) {
              await reqLogger.error("webhook", `Failed to update final metadata: ${finalMetaError.message}`);
            }

            await reqLogger.info("webhook", "Reservation created from flow", {
              metadata: {
                reservationId: reservationResult.reservationId,
                variables: mergedVariables,
              },
            });
          } else {
            await reqLogger.warn("webhook", "Could not create reservation", {
              metadata: {
                missingFields: reservationResult.missingFields,
                error: reservationResult.error,
              },
            });
          }
        } else if (shouldCreateReservation) {
          await reqLogger.warn("webhook", "Reservation data incomplete on confirmation", {
            metadata: {
              missingFields: getMissingReservationFields(mergedVariables),
              variables: mergedVariables,
            },
          });
        }
      } else {
        await reqLogger.info("webhook", "Skipping reservation creation for review flow", {
          metadata: { matchedFlowId, matchedNodeId },
        });
      }
    } else {
      await reqLogger.error("webhook", `Failed to send response: ${sendResult.error}`);
    }
  } else {
    await reqLogger.info("webhook", "No matching flow for message", {
      metadata: { messageText: messageText.slice(0, 100) },
    });

    // Update last_message_at even without response
    const { error: lastMsgError } = await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    if (lastMsgError) {
      await reqLogger.error("webhook", `Failed to update last_message_at: ${lastMsgError.message}`);
    }
  }
}
