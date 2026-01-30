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
  let newVariables: ExtractedVariables = {};
  if (messageText) {
    // Try general extraction first
    newVariables = extractVariables(messageText, {});

    // If no name was found but message looks like a name, extract it
    if (!existingVariables.name && !newVariables.name) {
      const extractedName = extractName(messageText);
      if (extractedName) {
        newVariables.name = extractedName;
      }
    }

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
  const mergedVariables = mergeVariables(existingVariables, newVariables);

  // Update metadata if new variables were extracted
  if (Object.keys(newVariables).length > 0) {
    const updatedMetadata: ConversationMetadata = {
      ...existingMetadata,
      variables: mergedVariables,
    };

    await supabase
      .from("conversations")
      .update({ metadata: updatedMetadata })
      .eq("id", conversation.id);

    await reqLogger.info("webhook", "Variables extracted from message", {
      metadata: { newVariables, mergedVariables },
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
      }
    }
  }

  // If still no response, try to match a new flow
  if (!flowResponse && messageText) {
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
      await supabase
        .from("conversations")
        .update({
          current_flow_id: matchedFlowId,
          current_node_id: flowResponse.nextNodeId || matchedNodeId,
          last_message_at: new Date().toISOString(),
          status: flowResponse.isEndOfFlow ? "closed" : "active",
        })
        .eq("id", conversation.id);

      await reqLogger.info("webhook", "Response sent successfully", {
        metadata: {
          messageId: sendResult.data.message_id,
          flowId: matchedFlowId,
          nodeId: matchedNodeId,
        },
      });

      // Create reservation automatically when flow ends with complete data
      if (flowResponse.isEndOfFlow && canCreateReservation(mergedVariables)) {
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
