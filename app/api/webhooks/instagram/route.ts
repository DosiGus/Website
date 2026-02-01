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
    .select("id, user_id, access_token")
    .eq("instagram_id", instagramAccountId)
    .eq("status", "connected")
    .single();

  if (integrationError || !integration) {
    await reqLogger.warn("webhook", `No integration found for Instagram ID: ${instagramAccountId}`);
    return;
  }

  const userId = integration.user_id;
  const accessToken = integration.access_token;

  if (!accessToken) {
    await reqLogger.error("webhook", "Integration has no access token");
    return;
  }

  // Get or create conversation
  let { data: conversation } = await supabase
    .from("conversations")
    .select("id, current_flow_id, current_node_id, metadata")
    .eq("integration_id", integration.id)
    .eq("instagram_sender_id", senderId)
    .single();

  if (!conversation) {
    const { data: newConversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        integration_id: integration.id,
        instagram_sender_id: senderId,
        status: "active",
        metadata: {},
      })
      .select("id, current_flow_id, current_node_id, metadata")
      .single();

    if (convError) {
      await reqLogger.error("webhook", `Failed to create conversation: ${convError.message}`);
      return;
    }

    conversation = newConversation;
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
  const existingMetadata = (conversation.metadata || {}) as ConversationMetadata;
  const existingVariables = existingMetadata.variables || {};

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
  }

  const hasOverrides = Object.keys(overrideVariables).length > 0;
  if (hasOverrides) {
    mergedVariables = { ...mergedVariables, ...overrideVariables };
  }

  // Update metadata if new variables were extracted or overridden
  if (Object.keys(newVariables).length > 0 || hasOverrides) {
    const updatedMetadata: ConversationMetadata = {
      ...existingMetadata,
      variables: mergedVariables,
    };

    await supabase
      .from("conversations")
      .update({ metadata: updatedMetadata })
      .eq("id", conversation.id);

    await reqLogger.info("webhook", "Variables extracted from message", {
      metadata: { newVariables, overrideVariables, mergedVariables },
    });
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
  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    direction: "incoming",
    message_type: messageType,
    content: messageText,
    quick_reply_payload: quickReplyPayload,
    instagram_message_id: instagramMessageId,
    flow_id: conversation.current_flow_id,
    node_id: conversation.current_node_id,
  });

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
        .eq("user_id", userId)
        .in("status", ["pending", "confirmed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingRes) {
        await supabase
          .from("reservations")
          .update({ status: "cancelled" })
          .eq("id", existingRes.id);

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
      const clearedMetadata: ConversationMetadata = {
        ...existingMetadata,
        variables: {},
        reservationId: undefined,
        flowCompleted: undefined,
      };
      await supabase
        .from("conversations")
        .update({ metadata: clearedMetadata, current_flow_id: null, current_node_id: null })
        .eq("id", conversation.id);
    }

    if (!forceNewReservation) {
      const { data: existingReservation } = await supabase
        .from("reservations")
        .select("id, guest_name, reservation_date, reservation_time, guest_count, status")
        .eq("instagram_sender_id", senderId)
        .eq("user_id", userId)
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

    const matchedFlow = await findMatchingFlow(userId, messageText);

    if (matchedFlow) {
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
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        direction: "outgoing",
        message_type: flowResponse.quickReplies.length > 0 ? "quick_reply" : "text",
        content: flowResponse.text,
        instagram_message_id: sendResult.data.message_id,
        flow_id: matchedFlowId,
        node_id: matchedNodeId,
      });

      // Update conversation state
      const storedNodeId = flowResponse.isEndOfFlow ? null : matchedNodeId;
      await supabase
        .from("conversations")
        .update({
          current_flow_id: matchedFlowId,
          current_node_id: storedNodeId,
          last_message_at: new Date().toISOString(),
          status: flowResponse.isEndOfFlow ? "closed" : "active",
        })
        .eq("id", conversation.id);

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

      // Check if reservation actually exists in database (not just in metadata)
      let reservationAlreadyExists = false;
      if (existingMetadata?.reservationId) {
        const { data: existingReservation } = await supabase
          .from("reservations")
          .select("id")
          .eq("id", existingMetadata.reservationId)
          .single();
        reservationAlreadyExists = Boolean(existingReservation);

        // If metadata has reservationId but reservation doesn't exist, clean up metadata
        if (!existingReservation) {
          await reqLogger.info("webhook", "Cleaning up orphaned reservationId from metadata", {
            metadata: { orphanedReservationId: existingMetadata.reservationId },
          });
          const cleanedMetadata: ConversationMetadata = {
            ...existingMetadata,
            reservationId: undefined,
            flowCompleted: undefined,
          };
          await supabase
            .from("conversations")
            .update({ metadata: cleanedMetadata })
            .eq("id", conversation.id);
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
      const looksLikeFinalStep =
        hasAllReservationData &&
        (flowResponse.isEndOfFlow ||
          flowResponse.quickReplies.length === 0 ||
          (flowResponse.text &&
            (flowResponse.text.toLowerCase().includes("bestätigt") ||
              flowResponse.text.toLowerCase().includes("reservierung") ||
              flowResponse.text.toLowerCase().includes("vielen dank") ||
              flowResponse.text.toLowerCase().includes("erfolgreich"))));

      const shouldCreateReservation =
        !reservationAlreadyExists &&
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
          conversation.id,
          matchedFlowId,
          mergedVariables,
          senderId
        );

        if (reservationResult.success) {
          // Update conversation metadata with reservation ID
          const finalMetadata: ConversationMetadata = {
            ...existingMetadata,
            variables: mergedVariables,
            reservationId: reservationResult.reservationId,
            flowCompleted: true,
          };

          await supabase
            .from("conversations")
            .update({ metadata: finalMetadata })
            .eq("id", conversation.id);

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
      await reqLogger.error("webhook", `Failed to send response: ${sendResult.error}`);
    }
  } else {
    await reqLogger.info("webhook", "No matching flow for message", {
      metadata: { messageText: messageText.slice(0, 100) },
    });

    // Update last_message_at even without response
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);
  }
}
