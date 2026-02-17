import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";
import crypto from "crypto";
import { createSupabaseServerClient } from "../../../../lib/supabaseServerClient";
import {
  verifyWebhookSignature,
  verifySubscriptionToken,
} from "../../../../lib/meta/webhookVerify";
import {
  InstagramWebhookPayload,
  InstagramMessagingEvent,
  InstagramWebhookChange,
} from "../../../../lib/meta/types";
import {
  sendInstagramMessage,
  sendInstagramMessageWithImage,
} from "../../../../lib/meta/instagramApi";
import { recordMessageFailure } from "../../../../lib/meta/messageFailures";
import { findMatchingFlow, listTriggerKeywords, parseQuickReplyPayload } from "../../../../lib/webhook/flowMatcher";
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
import { ConversationMetadata, FlowMetadata, FlowOutputConfig } from "../../../../lib/flowTypes";
import {
  canCreateReservation,
  createReservationFromVariables,
  getMissingReservationFields,
} from "../../../../lib/webhook/reservationCreator";
import { cancelGoogleCalendarEvent } from "../../../../lib/google/calendar";
import { type SlotSuggestion } from "../../../../lib/google/availability";
import { decryptToken, encryptToken, isEncryptedToken } from "../../../../lib/security/tokenEncryption";
import {
  findOrCreateContact,
  updateContactDisplayName,
  touchContact,
} from "../../../../lib/contacts";

class ConversationStateConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConversationStateConflictError";
  }
}

function extractReviewRating(text: string): number | null {
  if (!text) return null;
  const normalized = text.toLowerCase();
  const explicitMatch = normalized.match(/\b([1-5])\b\s*(?:\/\s*5|von\s*5|sterne?)\b/);
  if (explicitMatch) {
    return Number.parseInt(explicitMatch[1], 10);
  }
  const compact = normalized.replace(/\s+/g, "");
  if (/^[1-5][.!]?$/.test(compact)) {
    return Number.parseInt(compact[0], 10);
  }
  const starMatches = text.match(/⭐/g);
  if (starMatches && starMatches.length > 0 && starMatches.length <= 5) {
    return starMatches.length;
  }
  return null;
}

type ResolvedOutputConfig = {
  type: "reservation" | "custom";
  requiredFields: string[];
  defaults: Record<string, string | number>;
  isLegacy: boolean;
};

function resolveOutputConfig(metadata?: FlowMetadata | null): ResolvedOutputConfig {
  const outputConfig = metadata?.output_config as FlowOutputConfig | undefined;
  const hasOutputConfig = Boolean(outputConfig?.type);
  const type = outputConfig?.type ?? "reservation";
  const isLegacy = !hasOutputConfig;
  const defaults = {
    ...(outputConfig?.defaults ?? {}),
  };
  if (type === "reservation" && defaults.guestCount === undefined) {
    defaults.guestCount = 1;
  }
  const requiredFields =
    type === "reservation"
      ? outputConfig?.requiredFields ??
        (isLegacy ? ["name", "date", "time", "guestCount"] : ["name", "date", "time"])
      : outputConfig?.requiredFields ?? [];

  return { type, requiredFields, defaults, isLegacy };
}

function applyDefaults(
  variables: ExtractedVariables,
  defaults: Record<string, string | number>
): ExtractedVariables {
  const next = { ...variables };
  for (const [key, value] of Object.entries(defaults)) {
    const current = next[key];
    if (current === undefined || current === "") {
      next[key] = value;
    }
  }
  return next;
}

function formatSlotSuggestions(suggestions: SlotSuggestion[]): string {
  if (suggestions.length === 0) {
    return "Bitte nenne eine andere Uhrzeit oder ein anderes Datum.";
  }
  const lines = suggestions.map((slot) => `• ${formatDisplayDate(slot.date)} ${slot.time}`);
  return `Hier sind die nächsten freien Zeiten:\n${lines.join("\n")}\n\nBitte antworte mit einer Uhrzeit oder einem neuen Datum.`;
}

function formatDisplayDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    return `${day}.${month}.${year}`;
  }
  return dateStr;
}

const NAME_INPUT_BLACKLIST = [
  "ich weiß nicht",
  "ich weiss nicht",
  "weiß ich nicht",
  "weiss ich nicht",
  "keine ahnung",
  "keine idee",
];

const NAME_STOP_WORDS = new Set([
  "ich",
  "bin",
  "weiß",
  "weiss",
  "nicht",
  "keine",
  "kein",
  "mein",
  "meine",
  "name",
  "ja",
  "nein",
]);

function looksLikeNameInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 60) return false;
  const lower = trimmed.toLowerCase();
  if (NAME_INPUT_BLACKLIST.some((phrase) => lower.includes(phrase))) return false;
  if (/[0-9@]/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  if (words.length > 4) return false;
  if (words.some((word) => NAME_STOP_WORDS.has(word.toLowerCase()))) return false;
  return words.every((word) => /^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß'\.-]*$/.test(word));
}

async function findTimeNodeId(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  flowId: string
): Promise<string | null> {
  const { data: flow } = await supabase
    .from("flows")
    .select("nodes")
    .eq("id", flowId)
    .single();

  const nodes = Array.isArray(flow?.nodes) ? flow.nodes : [];
  const timeNode = nodes.find((node: any) => {
    const id = String(node?.id ?? "").toLowerCase();
    const label = String(node?.data?.label ?? "").toLowerCase();
    const text = String(node?.data?.text ?? "").toLowerCase();
    const collects = String(node?.data?.collects ?? "").toLowerCase();
    return (
      collects === "time" ||
      id.includes("time") ||
      label.includes("uhrzeit") ||
      text.includes("uhrzeit")
    );
  });

  return timeNode?.id ?? null;
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

    const qstashToken = process.env.QSTASH_TOKEN;
    if (!qstashToken) {
      await reqLogger.error("webhook", "QSTASH_TOKEN missing; processing inline");
      const baseUrl = new URL(request.url).origin;
      await processInstagramWebhookPayload(payload, reqLogger, baseUrl);
      return NextResponse.json({ received: true });
    }

    const qstash = new Client({ token: qstashToken });
    const baseUrl = new URL(request.url).origin;

    try {
      await qstash.publishJSON({
        url: `${baseUrl}/api/webhooks/instagram/process`,
        body: payload,
      });
    } catch (queueError) {
      await reqLogger.logError("webhook", queueError, "Failed to enqueue webhook");
      return NextResponse.json({ error: "Queueing failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await reqLogger.logError("webhook", error, "Webhook processing failed");
    // Always return 200 to Meta to prevent retries
    return NextResponse.json({ received: true });
  }
}

export async function processInstagramWebhookPayload(
  payload: InstagramWebhookPayload,
  reqLogger: ReturnType<typeof createRequestLogger>,
  baseUrl?: string
) {
  const entrySummaries = Array.isArray(payload?.entry)
    ? payload.entry.slice(0, 3).map((entry) => {
        const messaging = (entry as { messaging?: unknown }).messaging;
        const changes = (entry as { changes?: unknown }).changes;
        const changeFields = Array.isArray(changes)
          ? changes
              .map((change) =>
                (change as { field?: string }).field
              )
              .filter(Boolean)
          : [];
        return {
          id: entry.id,
          keys: Object.keys(entry ?? {}),
          messagingCount: Array.isArray(messaging) ? messaging.length : 0,
          changesCount: Array.isArray(changes) ? changes.length : 0,
          changeFields,
        };
      })
    : [];
  const hasMessagingEvents = entrySummaries.some(
    (summary) => summary.messagingCount > 0,
  );
  const hasChangeEvents = entrySummaries.some(
    (summary) => summary.changesCount > 0,
  );
  if (!hasMessagingEvents && !hasChangeEvents) {
    await reqLogger.warn("webhook", "Webhook payload has no messaging or change events", {
      metadata: {
        object: payload?.object,
        entryCount: Array.isArray(payload?.entry) ? payload.entry.length : 0,
        entrySummaries,
      },
    });
  }

  if (payload.object !== "instagram") {
    await reqLogger.info("webhook", `Ignoring non-Instagram event: ${payload.object}`);
    return;
  }

  for (const entry of payload.entry || []) {
    for (const event of entry.messaging || []) {
      try {
        await processMessagingEvent(event, entry.id, reqLogger, baseUrl);
      } catch (error) {
        await handleProcessingError(error, event, entry.id, reqLogger, baseUrl);
      }
    }
    const changeEvents = entry.changes || [];
    for (const change of changeEvents) {
      const mapped = await changeToMessagingEvent(change, entry.id, reqLogger);
      if (!mapped) continue;
      try {
        await processMessagingEvent(mapped.event, mapped.instagramAccountId, reqLogger, baseUrl);
      } catch (error) {
        await handleProcessingError(error, mapped.event, mapped.instagramAccountId, reqLogger, baseUrl);
      }
    }
  }
}

async function handleProcessingError(
  error: unknown,
  event: InstagramMessagingEvent,
  instagramAccountId: string,
  reqLogger: ReturnType<typeof createRequestLogger>,
  baseUrl?: string
) {
  if (error instanceof ConversationStateConflictError) {
    await enqueueConflictRetry(event, instagramAccountId, reqLogger, baseUrl);
    return;
  }

  await reqLogger.logError("webhook", error, "Failed to process messaging event", {
    metadata: { instagramAccountId },
  });
}

async function enqueueConflictRetry(
  event: InstagramMessagingEvent,
  instagramAccountId: string,
  reqLogger: ReturnType<typeof createRequestLogger>,
  baseUrl?: string
) {
  const qstashToken = process.env.QSTASH_TOKEN;
  if (!qstashToken || !baseUrl) {
    await reqLogger.warn("webhook", "Conflict retry skipped: missing QStash config");
    return;
  }

  const retryCount = typeof (event as any).__wesponde_retry === "number"
    ? (event as any).__wesponde_retry
    : 0;
  if (retryCount >= 2) {
    await reqLogger.warn("webhook", "Conflict retry limit reached", {
      metadata: { instagramAccountId, retryCount },
    });
    return;
  }

  const nextEvent = { ...event, __wesponde_retry: retryCount + 1 };
  const retryPayload = {
    object: "instagram",
    entry: [
      {
        id: instagramAccountId,
        time: event.timestamp ?? Date.now(),
        messaging: [nextEvent],
      },
    ],
  } as InstagramWebhookPayload;

  const qstash = new Client({ token: qstashToken });
  try {
    await qstash.publishJSON({
      url: `${baseUrl}/api/webhooks/instagram/process`,
      body: retryPayload,
      delay: 2,
    });
  } catch (queueError) {
    await reqLogger.logError("webhook", queueError, "Failed to requeue conflict retry");
  }
}

async function changeToMessagingEvent(
  change: InstagramWebhookChange,
  fallbackInstagramAccountId: string,
  reqLogger: ReturnType<typeof createRequestLogger>
): Promise<{ event: InstagramMessagingEvent; instagramAccountId: string } | null> {
  const supportedFields = new Set(["messages", "messaging_postbacks"]);
  if (!supportedFields.has(change.field)) {
    await reqLogger.info("webhook", "Ignoring unsupported webhook change field", {
      metadata: {
        changeField: change.field,
      },
    });
    return null;
  }

  const value = change.value as Record<string, unknown> | undefined;
  if (!value || typeof value !== "object") {
    return null;
  }

  const messageValue = (value as { message?: unknown }).message;
  const postback = (value as { postback?: InstagramMessagingEvent["postback"] }).postback;
  const text = (value as { text?: string }).text;

  if (!messageValue && !postback && !text) {
    return null;
  }

  const senderId =
    (value as { from?: { id?: string } }).from?.id ??
    (value as { sender?: { id?: string } }).sender?.id;
  const recipientId =
    (value as { to?: { id?: string } }).to?.id ??
    (value as { recipient?: { id?: string } }).recipient?.id ??
    fallbackInstagramAccountId;
  const timestamp =
    (value as { timestamp?: number }).timestamp ?? Date.now();

  if (!senderId) {
    await reqLogger.warn("webhook", "Webhook change missing sender id", {
      metadata: {
        changeField: change.field,
        valueKeys: Object.keys(value ?? {}),
      },
    });
    return null;
  }

  const messageId =
    (value as { message_id?: string }).message_id ??
    (value as { mid?: string }).mid ??
    (typeof messageValue === "object"
      ? (messageValue as { mid?: string }).mid
      : undefined);

  let normalizedMessage: InstagramMessagingEvent["message"] | undefined;
  if (messageValue && typeof messageValue === "object") {
    const messageText =
      (messageValue as { text?: string }).text ??
      (typeof text === "string" ? text : undefined);
    normalizedMessage = {
      mid: messageId ?? `${timestamp}-${senderId}`,
      text: messageText,
    };
  } else if (typeof messageValue === "string") {
    normalizedMessage = {
      mid: messageId ?? `${timestamp}-${senderId}`,
      text: messageValue,
    };
  } else if (typeof text === "string") {
    normalizedMessage = {
      mid: messageId ?? `${timestamp}-${senderId}`,
      text,
    };
  }

  if (!normalizedMessage && !postback) {
    await reqLogger.warn("webhook", "Webhook change has no message content", {
      metadata: {
        changeField: change.field,
        valueKeys: Object.keys(value ?? {}),
      },
    });
    return null;
  }

  return {
    event: {
      sender: { id: senderId },
      recipient: { id: recipientId },
      timestamp,
      message: normalizedMessage,
      postback,
    },
    instagramAccountId: recipientId,
  };
}

/**
 * Process a single messaging event from Instagram.
 */
async function processMessagingEvent(
  event: InstagramMessagingEvent,
  instagramAccountId: string,
  reqLogger: ReturnType<typeof createRequestLogger>,
  _baseUrl?: string
) {
  const supabase = createSupabaseServerClient();
  const senderId = event.sender.id;
  const recipientId = event.recipient.id;

  // Ignore messages sent by ourselves (echo)
  if (senderId === instagramAccountId) {
    return;
  }

  // Ignore read receipts, delivery receipts, and other non-message events early
  // These have neither message nor postback and should not enter the pipeline
  if (!event.message && !event.postback) {
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
  if (!integration.access_token) {
    await reqLogger.error("webhook", "Integration has no access token");
    return;
  }

  let accessToken: string | null = null;
  try {
    accessToken = decryptToken(integration.access_token);
  } catch (error) {
    await reqLogger.warn("webhook", "Failed to decrypt integration access token", {
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
    return;
  }

  if (!accessToken) {
    await reqLogger.error("webhook", "Integration access token missing after decrypt");
    return;
  }

  if (process.env.TOKEN_ENCRYPTION_KEY && !isEncryptedToken(integration.access_token)) {
    const { data: encryptedRow, error: encryptError } = await supabase
      .from("integrations")
      .update({
        access_token: encryptToken(integration.access_token),
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id)
      .eq("access_token", integration.access_token)
      .select("id")
      .maybeSingle();

    if (encryptError) {
      await reqLogger.warn("webhook", "Failed to encrypt integration token", {
        metadata: { error: encryptError.message },
      });
    } else if (!encryptedRow) {
      await reqLogger.info("webhook", "Integration token encryption skipped (already updated)");
    }
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
    .select("id, current_flow_id, current_node_id, metadata, contact_id, channel_sender_id, state_version")
    .eq("integration_id", integration.id)
    .eq("instagram_sender_id", senderId)
    .single();

  if (!conversation) {
    const { data: newConversation, error: convError } = await supabase
      .from("conversations")
      .upsert(
        {
          user_id: userId,
          account_id: accountId,
          integration_id: integration.id,
          contact_id: contactId,
          instagram_sender_id: senderId,
          channel: "instagram_dm",
          channel_sender_id: senderId,
          status: "active",
          metadata: {},
        },
        {
          onConflict: "integration_id,instagram_sender_id",
          ignoreDuplicates: true,
        },
      )
      .select("id, current_flow_id, current_node_id, metadata, contact_id, channel_sender_id, state_version")
      .maybeSingle();

    if (convError) {
      await reqLogger.error("webhook", `Failed to create conversation: ${convError.message}`);
      return;
    }

    conversation = newConversation;

    if (!conversation) {
      const { data: existingConversation, error: existingError } = await supabase
        .from("conversations")
        .select("id, current_flow_id, current_node_id, metadata, contact_id, channel_sender_id, state_version")
        .eq("integration_id", integration.id)
        .eq("instagram_sender_id", senderId)
        .single();

      if (existingError || !existingConversation) {
        await reqLogger.error(
          "webhook",
          `Failed to resolve conversation after upsert: ${existingError?.message ?? "Not found"}`,
        );
        return;
      }

      conversation = existingConversation;
    }
  }

  let conversationVersion = conversation.state_version ?? 0;
  let responseSent = false;

  const updateConversationState = async (
    updates: Record<string, unknown>,
    context: string
  ) => {
    const { data, error } = await supabase
      .from("conversations")
      .update({
        ...updates,
        state_version: conversationVersion + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id)
      .eq("state_version", conversationVersion)
      .select("state_version")
      .maybeSingle();

    if (error) {
      await reqLogger.error("webhook", `${context}: ${error.message}`);
      throw error;
    }

    if (!data) {
      if (responseSent) {
        await reqLogger.warn("webhook", "Conversation update skipped due to version conflict", {
          metadata: { context },
        });
        return false;
      }
      throw new ConversationStateConflictError(context);
    }

    conversationVersion = data.state_version;
    return true;
  };

  if (contactId && !conversation.contact_id) {
    const updated = await updateConversationState(
      {
        contact_id: contactId,
        channel: "instagram_dm",
        channel_sender_id: senderId,
      },
      "Failed to backfill contact on conversation"
    );

    if (updated) {
      conversation.contact_id = contactId;
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

  if (!instagramMessageId && event.postback) {
    const payloadPart = (quickReplyPayload ?? "").slice(0, 120);
    const timestampPart = event.timestamp ?? Date.now();
    const nonce = crypto.randomUUID();
    instagramMessageId = `postback:${senderId}:${recipientId}:${timestampPart}:${payloadPart}:${nonce}`;
  }

  let incomingMessageRowId: string | null = null;
  let shouldMarkProcessed = false;
  const processingStartedAt = new Date().toISOString();
  const processingTimeoutMs = 30 * 1000;
  const processingCutoff = new Date(Date.now() - processingTimeoutMs).toISOString();

  // Idempotency gate: record the incoming message first (duplicate webhooks are common).
  const incomingMessageRecord = {
    conversation_id: conversation.id,
    direction: "incoming",
    message_type: messageType,
    content: messageText,
    quick_reply_payload: quickReplyPayload,
    instagram_message_id: instagramMessageId,
    channel_message_id: instagramMessageId,
    flow_id: conversation.current_flow_id,
    node_id: conversation.current_node_id,
    processing_started_at: processingStartedAt,
    processed_at: null,
  };

  if (instagramMessageId) {
    const { data: incomingMessage, error: incomingInsertError } = await supabase
      .from("messages")
      .insert(incomingMessageRecord)
      .select("id, processed_at, processing_started_at")
      .single();

    if (!incomingInsertError && incomingMessage) {
      incomingMessageRowId = incomingMessage.id;
      shouldMarkProcessed = true;
    }

    if (incomingInsertError) {
      const isDuplicate =
        incomingInsertError.code === "23505" ||
        incomingInsertError.message.toLowerCase().includes("duplicate");
      if (isDuplicate) {
        const { data: existingMessage } = await supabase
          .from("messages")
          .select("id, processed_at, processing_started_at")
          .eq("instagram_message_id", instagramMessageId)
          .maybeSingle();

        if (existingMessage?.processed_at) {
          await reqLogger.info("webhook", "Duplicate message already processed, skipping", {
            metadata: { instagramMessageId },
          });
          return;
        }

        const inFlight =
          existingMessage?.processing_started_at &&
          existingMessage.processing_started_at > processingCutoff;

        if (inFlight) {
          await reqLogger.info("webhook", "Duplicate message still processing, skipping", {
            metadata: { instagramMessageId },
          });
          return;
        }

        const { data: claimedMessage } = await supabase
          .from("messages")
          .update({ processing_started_at: processingStartedAt })
          .eq("instagram_message_id", instagramMessageId)
          .is("processed_at", null)
          .or(`processing_started_at.is.null,processing_started_at.lt.${processingCutoff}`)
          .select("id")
          .maybeSingle();

        if (!claimedMessage) {
          await reqLogger.info("webhook", "Duplicate message claimed by another worker", {
            metadata: { instagramMessageId },
          });
          return;
        }

        incomingMessageRowId = claimedMessage.id;
        shouldMarkProcessed = true;
        await reqLogger.info("webhook", "Duplicate message reclaimed for processing", {
          metadata: { instagramMessageId },
        });
      } else {
        await reqLogger.error(
          "webhook",
          `Failed to save incoming message: ${incomingInsertError.message}`,
        );
      }
    }
  } else {
    const { error: incomingInsertError } = await supabase
      .from("messages")
      .insert(incomingMessageRecord);

    if (incomingInsertError) {
      await reqLogger.error(
        "webhook",
        `Failed to save incoming message: ${incomingInsertError.message}`,
      );
    }
  }

  const markMessageProcessed = async () => {
    if (!shouldMarkProcessed || !incomingMessageRowId) return;
    await supabase
      .from("messages")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", incomingMessageRowId);
  };

  let allowMarkProcessed = true;
  try {
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
      } else if (looksLikeNameInput(trimmedMessage)) {
        overrideVariables.name = trimmedMessage;
      }
    }

    if (nodeKey.includes("date")) {
      const extractedDate = extractDate(trimmedMessage);
      if (extractedDate) overrideVariables.date = extractedDate;
    }

    if (nodeKey.includes("time")) {
      const extractedTime = extractTime(trimmedMessage, { allowDotWithoutUhr: true });
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

    const metadataUpdated = await updateConversationState(
      { metadata: updatedMetadata },
      "Failed to update conversation metadata"
    );
    if (!metadataUpdated) {
      await reqLogger.warn("webhook", "Conversation metadata update skipped due to version conflict");
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
  let matchedFlowMetadata: FlowMetadata | null = null;

  // Handle quick reply continuation
  if (quickReplyPayload && conversation.current_flow_id) {
    const parsed = parseQuickReplyPayload(quickReplyPayload);

    if (parsed) {
      // Load the flow
      const { data: flow } = await supabase
        .from("flows")
        .select("nodes, edges, metadata")
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
        matchedFlowMetadata = (flow.metadata as FlowMetadata) ?? null;

        if (!flowResponse) {
          flowResponse = {
            text: "Diese Auswahl ist nicht mehr verfügbar. Bitte starte den Ablauf erneut.",
            quickReplies: [],
            nextNodeId: null,
            isEndOfFlow: true,
          };
          matchedNodeId = null;
        }
      }
    }
  }

  // If no quick reply match but user is in an active flow, try free text continuation
  if (!flowResponse && messageText && conversation.current_flow_id && conversation.current_node_id) {
    // Load the current flow
    const { data: currentFlow } = await supabase
      .from("flows")
      .select("nodes, edges, metadata")
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
        matchedFlowMetadata = (currentFlow.metadata as FlowMetadata) ?? null;

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
      let reservationQuery = supabase
        .from("reservations")
        .select("id, guest_name, reservation_date, reservation_time, google_event_id, google_calendar_id")
        .eq("account_id", accountId)
        .in("status", ["pending", "confirmed"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (contactId) {
        reservationQuery = reservationQuery.eq("contact_id", contactId);
      } else {
        reservationQuery = reservationQuery.eq("instagram_sender_id", senderId);
      }

      const { data: existingRes } = await reservationQuery.single();

      if (existingRes) {
        const { error: cancelError } = await supabase
          .from("reservations")
          .update({ status: "cancelled" })
          .eq("id", existingRes.id);

        if (cancelError) {
          await reqLogger.error("webhook", `Failed to cancel reservation: ${cancelError.message}`);
        }

        if (existingRes.google_event_id) {
          try {
            await cancelGoogleCalendarEvent({
              accountId,
              eventId: existingRes.google_event_id,
              calendarId: existingRes.google_calendar_id ?? undefined,
            });
          } catch (error) {
            await reqLogger.warn("webhook", "Failed to cancel calendar event for reservation", {
              metadata: {
                reservationId: existingRes.id,
                error: error instanceof Error ? error.message : String(error),
              },
            });
          }
        }

        const cancelText = `✅ Deine Reservierung wurde storniert.\n\nFalls du eine neue Reservierung machen möchtest, schreib einfach "Reservieren" oder "Tisch buchen".`;

        const cancelSendResult = await sendInstagramMessage({
          recipientId: senderId,
          text: cancelText,
          quickReplies: [
            { label: "Neue Reservierung", payload: "NEUE_RESERVIERUNG" },
          ],
          accessToken,
        });
        if (!cancelSendResult.success) {
          await reqLogger.warn("webhook", "Failed to send cancellation message", {
            metadata: { error: cancelSendResult.error, code: cancelSendResult.code },
          });
          try {
            await recordMessageFailure({
              integrationId: integration.id,
              conversationId: conversation.id,
              recipientId: senderId,
              messageType: "quick_reply",
              content: cancelText,
              quickReplies: [{ label: "Neue Reservierung", payload: "NEUE_RESERVIERUNG" }],
              errorCode: cancelSendResult.code,
              errorMessage: cancelSendResult.error,
              retryable: cancelSendResult.retryable,
              attempts: cancelSendResult.attempts,
            });
          } catch (error) {
            await reqLogger.warn("webhook", "Failed to record message failure", {
              metadata: { error: String(error) },
            });
          }
        }

        await reqLogger.info("webhook", "Reservation cancelled by user", {
          metadata: { reservationId: existingRes.id },
        });
        return;
      }
    }

    if (quickReplyPayload === "KEEP_EXISTING_RESERVATION") {
      const keepText = `👍 Alles klar! Deine bestehende Reservierung bleibt unverändert.\n\nFalls du Fragen hast, schreib uns einfach!`;

      const keepSendResult = await sendInstagramMessage({
        recipientId: senderId,
        text: keepText,
        quickReplies: [],
        accessToken,
      });
      if (!keepSendResult.success) {
        await reqLogger.warn("webhook", "Failed to send keep-reservation message", {
          metadata: { error: keepSendResult.error, code: keepSendResult.code },
        });
        try {
          await recordMessageFailure({
            integrationId: integration.id,
            conversationId: conversation.id,
            recipientId: senderId,
            messageType: "text",
            content: keepText,
            errorCode: keepSendResult.code,
            errorMessage: keepSendResult.error,
            retryable: keepSendResult.retryable,
            attempts: keepSendResult.attempts,
          });
        } catch (error) {
          await reqLogger.warn("webhook", "Failed to record message failure", {
            metadata: { error: String(error) },
          });
        }
      }
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
      const resetUpdated = await updateConversationState(
        { metadata: existingMetadata, current_flow_id: null, current_node_id: null },
        "Failed to reset conversation for new reservation"
      );
      if (!resetUpdated) {
        await reqLogger.warn("webhook", "Conversation reset skipped due to version conflict");
        return;
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

        const existingResSendResult = await sendInstagramMessage({
          recipientId: senderId,
          text: existingResText,
          quickReplies: [
            { label: "Stornieren", payload: "CANCEL_EXISTING_RESERVATION" },
            { label: "Behalten", payload: "KEEP_EXISTING_RESERVATION" },
            { label: "Neue Reservierung", payload: "FORCE_NEW_RESERVATION" },
          ],
          accessToken,
        });
        if (!existingResSendResult.success) {
          await reqLogger.warn("webhook", "Failed to send existing reservation options", {
            metadata: { error: existingResSendResult.error, code: existingResSendResult.code },
          });
          try {
            await recordMessageFailure({
              integrationId: integration.id,
              conversationId: conversation.id,
              recipientId: senderId,
              messageType: "quick_reply",
              content: existingResText,
              quickReplies: [
                { label: "Stornieren", payload: "CANCEL_EXISTING_RESERVATION" },
                { label: "Behalten", payload: "KEEP_EXISTING_RESERVATION" },
                { label: "Neue Reservierung", payload: "FORCE_NEW_RESERVATION" },
              ],
              errorCode: existingResSendResult.code,
              errorMessage: existingResSendResult.error,
              retryable: existingResSendResult.retryable,
              attempts: existingResSendResult.attempts,
            });
          } catch (error) {
            await reqLogger.warn("webhook", "Failed to record message failure", {
              metadata: { error: String(error) },
            });
          }
        }

        await reqLogger.info("webhook", "User has existing reservation, showing options", {
          metadata: {
            existingReservationId: existingReservation.id,
            status: existingReservation.status,
          },
        });
        return;
      }
    }

    const canStartNewFlow =
      !conversation.current_flow_id || !conversation.current_node_id || forceNewReservation;

    const matchedFlow = canStartNewFlow
      ? await findMatchingFlow(accountId, messageText)
      : null;

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
      const resetUpdated = await updateConversationState(
        { metadata: existingMetadata, current_flow_id: null, current_node_id: null },
        "Failed to reset conversation for new flow"
      );
      if (!resetUpdated) {
        await reqLogger.warn("webhook", "Conversation reset skipped due to version conflict");
        return;
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
      matchedFlowMetadata = (matchedFlow.metadata as FlowMetadata) ?? null;

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

    if (!sendResult.success) {
      await reqLogger.warn("webhook", "Failed to send response", {
        metadata: { error: sendResult.error, code: sendResult.code },
      });
      try {
        await recordMessageFailure({
          integrationId: integration.id,
          conversationId: conversation.id,
          recipientId: senderId,
          messageType: flowResponse.quickReplies.length > 0 ? "quick_reply" : "text",
          content: flowResponse.text,
          quickReplies: flowResponse.quickReplies,
          errorCode: sendResult.code,
          errorMessage: sendResult.error,
          retryable: sendResult.retryable,
          attempts: sendResult.attempts,
          flowId: matchedFlowId,
          nodeId: matchedNodeId,
        });
      } catch (error) {
        await reqLogger.warn("webhook", "Failed to record message failure", {
          metadata: { error: String(error) },
        });
      }
      return;
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
      responseSent = true;
      const storedNodeId = flowResponse.isEndOfFlow ? null : matchedNodeId;
      const stateUpdated = await updateConversationState(
        {
          current_flow_id: matchedFlowId,
          current_node_id: storedNodeId,
          last_message_at: new Date().toISOString(),
          status: flowResponse.isEndOfFlow ? "closed" : "active",
        },
        "Failed to update conversation state"
      );
      if (!stateUpdated) {
        await reqLogger.warn("webhook", "Conversation state update skipped due to version conflict");
        return;
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
            const cleanupUpdated = await updateConversationState(
              { metadata: cleanedMetadata },
              "Failed to cleanup orphaned metadata"
            );
            if (!cleanupUpdated) {
              await reqLogger.warn("webhook", "Metadata cleanup skipped due to version conflict");
            }
          }
        }

        const matchedNodeIdLower = matchedNodeId?.toLowerCase() ?? "";

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

        const outputConfig = resolveOutputConfig(matchedFlowMetadata);
        const outputType = outputConfig.type;
        const reservationVariables = applyDefaults(mergedVariables, outputConfig.defaults);
        const missingReservationFields = getMissingReservationFields(
          reservationVariables,
          outputConfig.requiredFields
        );

        // Check if all required reservation data is present and this looks like a final step
        const hasAllReservationData = canCreateReservation(
          reservationVariables,
          outputConfig.requiredFields
        );

        // List of nodes that are still collecting data - don't create reservation here
        const dataCollectionNodes = [
          "ask-name", "ask-phone", "ask-special", "ask-date", "ask-time", "ask-guests",
          "ask-date-custom", "ask-time-custom", "ask-guests-large",
          "special-allergy", "special-occasion"
        ];
        const isDataCollectionNode = dataCollectionNodes.some((nodeId) => {
          const nodeIdLower = nodeId.toLowerCase();
          return (
            matchedNodeIdLower === nodeIdLower ||
            matchedNodeIdLower.startsWith(`${nodeIdLower}-`)
          );
        });

        // Only consider it a final step if the response text explicitly confirms the reservation
        // AND we're not at a data collection node
        const looksLikeFinalStep =
          hasAllReservationData && !isDataCollectionNode && flowResponse.isEndOfFlow;

        const shouldStoreSubmission =
          flowResponse.isEndOfFlow ||
          isConfirmationPayload ||
          looksLikeFinalStep;

        const shouldCreateReservation =
          outputType === "reservation" &&
          !reservationAlreadyExists &&
          !isDataCollectionNode &&
          shouldStoreSubmission;

        // Log reservation check details for debugging
        await reqLogger.info("webhook", "Reservation check", {
          metadata: {
            reservationAlreadyExists,
            isEndOfFlow: flowResponse.isEndOfFlow,
            isConfirmationPayload,
            looksLikeFinalStep,
            hasAllReservationData,
            matchedNodeId,
            quickReplyPayload,
            responseText: flowResponse.text?.slice(0, 100),
            shouldCreateReservation,
            outputType,
            outputRequiredFields: outputConfig.requiredFields,
            outputDefaults: outputConfig.defaults,
            canCreate: canCreateReservation(reservationVariables, outputConfig.requiredFields),
            missingFields: missingReservationFields,
            variables: reservationVariables,
          },
        });

        if (shouldStoreSubmission && matchedFlowId) {
          const submissionStatus =
            missingReservationFields.length > 0 ? "incomplete" : "completed";
          const { error: submissionError } = await supabase
            .from("flow_submissions")
            .insert({
              user_id: userId,
              account_id: accountId,
              flow_id: matchedFlowId,
              conversation_id: conversation.id,
              contact_id: contactId ?? null,
              integration_id: integration.id,
              status: submissionStatus,
              missing_fields: missingReservationFields,
              data: {
                variables: reservationVariables,
                outputType,
                flowId: matchedFlowId,
                nodeId: matchedNodeId,
              },
              source: "instagram_dm",
              completed_at: submissionStatus === "completed" ? new Date().toISOString() : null,
            });

          if (submissionError) {
            await reqLogger.warn("webhook", "Failed to store flow submission", {
              metadata: {
                flowId: matchedFlowId,
                error: submissionError.message,
              },
            });
          }
        }

        if (shouldCreateReservation && canCreateReservation(reservationVariables, outputConfig.requiredFields)) {
          const reservationResult = await createReservationFromVariables(
            userId,
            accountId,
            conversation.id,
            matchedFlowId,
            reservationVariables,
            senderId,
            contactId ?? undefined,
            outputConfig.requiredFields
          );

          if (reservationResult.success) {
            // Update conversation metadata with reservation ID
            const finalMetadata: ConversationMetadata = {
              ...existingMetadata,
              variables: mergedVariables,
              reservationId: reservationResult.reservationId,
              flowCompleted: true,
            };

            const finalUpdated = await updateConversationState(
              { metadata: finalMetadata },
              "Failed to update final metadata"
            );
            if (!finalUpdated) {
              await reqLogger.warn("webhook", "Final metadata update skipped due to version conflict");
            }

            await reqLogger.info("webhook", "Reservation created from flow", {
              metadata: {
                reservationId: reservationResult.reservationId,
                variables: reservationVariables,
              },
            });

            if (reservationResult.warning === "calendar_error") {
              const calendarWarningMessage =
                "ℹ️ Dein Termin wurde gespeichert. Der Kalender konnte gerade nicht aktualisiert werden.";

              const warningSendResult = await sendInstagramMessage({
                recipientId: senderId,
                text: calendarWarningMessage,
                quickReplies: [],
                accessToken,
              });
              if (!warningSendResult.success) {
                await reqLogger.warn("webhook", "Failed to send calendar warning message", {
                  metadata: { error: warningSendResult.error, code: warningSendResult.code },
                });
                try {
                  await recordMessageFailure({
                    integrationId: integration.id,
                    conversationId: conversation.id,
                    recipientId: senderId,
                    messageType: "text",
                    content: calendarWarningMessage,
                    errorCode: warningSendResult.code,
                    errorMessage: warningSendResult.error,
                    retryable: warningSendResult.retryable,
                    attempts: warningSendResult.attempts,
                  });
                } catch (error) {
                  await reqLogger.warn("webhook", "Failed to record message failure", {
                    metadata: { error: String(error) },
                  });
                }
              }
            }
          } else {
            if (reservationResult.error === "availability_error") {
              const availabilityErrorMessage =
                "⚠️ Wir konnten den Kalender gerade nicht prüfen. Bitte versuche es in ein paar Minuten erneut oder nenne eine alternative Zeit.";

              const availabilitySendResult = await sendInstagramMessage({
                recipientId: senderId,
                text: availabilityErrorMessage,
                quickReplies: [],
                accessToken,
              });
              if (!availabilitySendResult.success) {
                await reqLogger.warn("webhook", "Failed to send availability error message", {
                  metadata: { error: availabilitySendResult.error, code: availabilitySendResult.code },
                });
                try {
                  await recordMessageFailure({
                    integrationId: integration.id,
                    conversationId: conversation.id,
                    recipientId: senderId,
                    messageType: "text",
                    content: availabilityErrorMessage,
                    errorCode: availabilitySendResult.code,
                    errorMessage: availabilitySendResult.error,
                    retryable: availabilitySendResult.retryable,
                    attempts: availabilitySendResult.attempts,
                  });
                } catch (error) {
                  await reqLogger.warn("webhook", "Failed to record message failure", {
                    metadata: { error: String(error) },
                  });
                }
              }

              await reqLogger.warn("webhook", "Availability check failed, reservation skipped", {
                metadata: {
                  flowId: matchedFlowId,
                  variables: reservationVariables,
                },
              });
              return;
            }

            if (reservationResult.error === "calendar_error") {
              const calendarErrorMessage =
                "⚠️ Wir konnten den Termin im Kalender nicht speichern. Bitte versuche es gleich noch einmal.";

              const calendarSendResult = await sendInstagramMessage({
                recipientId: senderId,
                text: calendarErrorMessage,
                quickReplies: [],
                accessToken,
              });
              if (!calendarSendResult.success) {
                await reqLogger.warn("webhook", "Failed to send calendar error message", {
                  metadata: { error: calendarSendResult.error, code: calendarSendResult.code },
                });
                try {
                  await recordMessageFailure({
                    integrationId: integration.id,
                    conversationId: conversation.id,
                    recipientId: senderId,
                    messageType: "text",
                    content: calendarErrorMessage,
                    errorCode: calendarSendResult.code,
                    errorMessage: calendarSendResult.error,
                    retryable: calendarSendResult.retryable,
                    attempts: calendarSendResult.attempts,
                  });
                } catch (error) {
                  await reqLogger.warn("webhook", "Failed to record message failure", {
                    metadata: { error: String(error) },
                  });
                }
              }

              if (calendarSendResult.success) {
                responseSent = true;
              }

              await reqLogger.warn("webhook", "Calendar event failed, reservation skipped", {
                metadata: {
                  flowId: matchedFlowId,
                  variables: reservationVariables,
                },
              });
              return;
            }

            if (reservationResult.error === "calendar_store_failed") {
              const storeErrorMessage =
                "⚠️ Wir konnten deine Buchung gerade nicht speichern. Bitte versuche es gleich noch einmal.";

              const storeSendResult = await sendInstagramMessage({
                recipientId: senderId,
                text: storeErrorMessage,
                quickReplies: [],
                accessToken,
              });
              if (!storeSendResult.success) {
                await reqLogger.warn("webhook", "Failed to send reservation store error message", {
                  metadata: { error: storeSendResult.error, code: storeSendResult.code },
                });
                try {
                  await recordMessageFailure({
                    integrationId: integration.id,
                    conversationId: conversation.id,
                    recipientId: senderId,
                    messageType: "text",
                    content: storeErrorMessage,
                    errorCode: storeSendResult.code,
                    errorMessage: storeSendResult.error,
                    retryable: storeSendResult.retryable,
                    attempts: storeSendResult.attempts,
                  });
                } catch (error) {
                  await reqLogger.warn("webhook", "Failed to record message failure", {
                    metadata: { error: String(error) },
                  });
                }
              }

              if (storeSendResult.success) {
                responseSent = true;
              }

              await reqLogger.warn("webhook", "Reservation store failed after calendar event", {
                metadata: {
                  flowId: matchedFlowId,
                  variables: reservationVariables,
                },
              });
              return;
            }

            if (reservationResult.error === "slot_unavailable") {
              const suggestionText = formatSlotSuggestions(reservationResult.suggestions ?? []);
              const unavailableMessage =
                `❗ Leider ist der gewünschte Termin nicht verfügbar.\n\n${suggestionText}`;

              const unavailableSendResult = await sendInstagramMessage({
                recipientId: senderId,
                text: unavailableMessage,
                quickReplies: [],
                accessToken,
              });
              if (!unavailableSendResult.success) {
                await reqLogger.warn("webhook", "Failed to send slot unavailable message", {
                  metadata: { error: unavailableSendResult.error, code: unavailableSendResult.code },
                });
                try {
                  await recordMessageFailure({
                    integrationId: integration.id,
                    conversationId: conversation.id,
                    recipientId: senderId,
                    messageType: "text",
                    content: unavailableMessage,
                    errorCode: unavailableSendResult.code,
                    errorMessage: unavailableSendResult.error,
                    retryable: unavailableSendResult.retryable,
                    attempts: unavailableSendResult.attempts,
                  });
                } catch (error) {
                  await reqLogger.warn("webhook", "Failed to record message failure", {
                    metadata: { error: String(error) },
                  });
                }
              }

              if (unavailableSendResult.success) {
                responseSent = true;
              }

              const updatedVariables: ExtractedVariables = {
                ...mergedVariables,
                time: undefined,
              };

              const resetMetadata: ConversationMetadata = {
                ...existingMetadata,
                variables: updatedVariables,
                reservationId: undefined,
                flowCompleted: undefined,
              };

              const timeNodeId = matchedFlowId
                ? await findTimeNodeId(supabase, matchedFlowId)
                : null;

              const resetUpdated = await updateConversationState(
                {
                  metadata: resetMetadata,
                  current_flow_id: matchedFlowId,
                  current_node_id: timeNodeId,
                  status: "active",
                },
                "Failed to reset conversation after slot unavailable"
              );
              if (!resetUpdated) {
                await reqLogger.warn("webhook", "Slot reset skipped due to version conflict");
              }

              await reqLogger.info("webhook", "Slot unavailable, user prompted for new time", {
                metadata: {
                  flowId: matchedFlowId,
                  suggestions: reservationResult.suggestions ?? [],
                },
              });
              return;
            }

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
              missingFields: missingReservationFields,
              variables: reservationVariables,
            },
          });
        }
      } else {
        await reqLogger.info("webhook", "Skipping reservation creation for review flow", {
          metadata: { matchedFlowId, matchedNodeId },
        });
      }
    }
  } else {
    await reqLogger.info("webhook", "No matching flow for message", {
      metadata: { messageText: messageText.slice(0, 100) },
    });

    if (messageType === "text" && messageText.trim().length > 0) {
      const keywords = await listTriggerKeywords(accountId);
      const fallbackMessage = keywords.length > 0
        ? `Ich habe dich nicht verstanden. Du kannst z. B. schreiben: ${keywords.join(", ")}.`
        : "Ich habe dich nicht verstanden. Bitte schreibe kurz, wobei ich helfen kann.";

      const fallbackSendResult = await sendInstagramMessage({
        recipientId: senderId,
        text: fallbackMessage,
        quickReplies: [],
        accessToken,
      });
      if (!fallbackSendResult.success) {
        await reqLogger.warn("webhook", "Failed to send fallback message", {
          metadata: { error: fallbackSendResult.error, code: fallbackSendResult.code },
        });
        try {
          await recordMessageFailure({
            integrationId: integration.id,
            conversationId: conversation.id,
            recipientId: senderId,
            messageType: "text",
            content: fallbackMessage,
            errorCode: fallbackSendResult.code,
            errorMessage: fallbackSendResult.error,
            retryable: fallbackSendResult.retryable,
            attempts: fallbackSendResult.attempts,
          });
        } catch (error) {
          await reqLogger.warn("webhook", "Failed to record message failure", {
            metadata: { error: String(error) },
          });
        }
      }

      if (fallbackSendResult.success) {
        responseSent = true;
      }
    }

    // Update last_message_at even without response
    const lastSeenUpdated = await updateConversationState(
      { last_message_at: new Date().toISOString() },
      "Failed to update last_message_at"
    );
    if (!lastSeenUpdated) {
      await reqLogger.warn("webhook", "last_message_at update skipped due to version conflict");
    }
  }
  } catch (error) {
    if (error instanceof ConversationStateConflictError) {
      allowMarkProcessed = false;
    }
    throw error;
  } finally {
    if (allowMarkProcessed) {
      await markMessageProcessed();
    }
  }
}
