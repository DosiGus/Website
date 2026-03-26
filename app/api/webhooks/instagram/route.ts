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
import { findMatchingFlow, findBookingFlow, loadFlowById, listTriggerKeywords, parseQuickReplyPayload, deriveFallbackStartNodeId } from "../../../../lib/webhook/flowMatcher";
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
import { ConversationMetadata, FlowMetadata, FlowOutputConfig, FlowTrigger } from "../../../../lib/flowTypes";
import {
  canCreateReservation,
  createReservationFromVariables,
  getMissingReservationFields,
} from "../../../../lib/webhook/reservationCreator";
import { cancelGoogleCalendarEvent } from "../../../../lib/google/calendar";
import { sendReservationNotification } from "../../../../lib/email/reservationNotification";
import { type SlotSuggestion, getAvailableSlotsForDate } from "../../../../lib/google/availability";
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

/**
 * Finds the node in a flow that collects a given field key.
 * Uses node.data.collects as primary source of truth.
 * Falls back to node.id pattern matching for legacy templates without collects field.
 */
function findCollectionNodeForField(nodes: any[], field: string): any | null {
  // Primary: explicit collects field
  const byCollects = nodes.find((n: any) => {
    const rawCollects = String(n?.data?.collects ?? "").trim();
    return rawCollects === field && rawCollects !== "__custom_empty__";
  });
  if (byCollects) return byCollects;

  // Fallback: legacy node.id pattern matching
  return nodes.find((n: any) => {
    const nk = String(n.id ?? "").toLowerCase();
    switch (field) {
      case "name":            return nk.includes("name");
      case "date":            return nk.includes("date");
      case "time":            return nk.includes("time");
      case "guestCount":      return nk.includes("guest");
      case "phone":           return nk.includes("phone") || nk.includes("telefon") || nk.includes("nummer");
      case "email":           return nk.includes("email") || nk.includes("mail");
      case "specialRequests": return nk.includes("special") || nk.includes("wunsch") || nk.includes("wünsch") || nk.includes("notiz");
      default:                return false;
    }
  }) ?? null;
}

/**
 * Formats a stored variable value for display in a correction Quick Reply label.
 * Keeps labels short enough to fit Instagram's Quick Reply button limits.
 */
function formatVariableForCorrection(key: string, value: unknown): string {
  if (key === "date" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDisplayDate(value);
  }
  const str = String(value ?? "");
  // Truncate only very long values (for text body display, not button labels)
  return str.length > 30 ? str.slice(0, 28) + "…" : str;
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
  // Guest notification is handled inside processMessagingEvent's own catch block
  // using the already-loaded accessToken — no redundant DB query needed here.
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

// Primary source of truth: the explicit variant field set in the Flow Builder.
// "confirmation" is the canonical value; "confirmed" is kept as a legacy alias
// for flows created before this was standardized.
// Keyword-based detection was removed — it was fragile and non-deterministic.
function nodeIsConfirmation(_nodeId: string, _nodeLabel: string, nodeVariant: string): boolean {
  const variantLower = nodeVariant.toLowerCase();
  return variantLower === "confirmation" || variantLower === "confirmed";
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

  let userId: string | null = integration.user_id;
  const accountId = integration.account_id;

  // Fallback: if the integration row has no user_id (possible after multi-tenant migration),
  // use the account owner's user_id so the reservations.user_id NOT NULL constraint is satisfied.
  if (!userId) {
    const { data: ownerMember } = await supabase
      .from("account_members")
      .select("user_id")
      .eq("account_id", accountId)
      .eq("role", "owner")
      .maybeSingle();
    userId = ownerMember?.user_id ?? null;
    if (userId) {
      await reqLogger.info("webhook", "Resolved userId from account owner (integration.user_id was null)", {
        metadata: { accountId },
      });
    } else {
      // userId is still null after all fallbacks. Non-reservation flows continue normally.
      // Reservation creation will be blocked with a guest-facing error (see guard below).
      await reqLogger.warn("webhook", "userId could not be resolved — reservation creation will fail if triggered", {
        metadata: { accountId },
      });
    }
  }
  reqLogger.setAccountId(accountId);
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

  // Get or create conversation — lookup via channel_sender_id (channel-agnostic primary key)
  let { data: conversation } = await supabase
    .from("conversations")
    .select("id, current_flow_id, current_node_id, metadata, contact_id, channel_sender_id, state_version, last_message_at")
    .eq("integration_id", integration.id)
    .eq("channel_sender_id", senderId)
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
          instagram_sender_id: senderId,  // kept for Instagram; null for other channels
          channel: "instagram_dm",
          channel_sender_id: senderId,    // primary lookup key
          status: "active",
          metadata: {},
        },
        {
          onConflict: "integration_id,channel,channel_sender_id",
          ignoreDuplicates: true,
        },
      )
      .select("id, current_flow_id, current_node_id, metadata, contact_id, channel_sender_id, state_version, last_message_at")
      .maybeSingle();

    if (convError) {
      await reqLogger.error("webhook", `Failed to create conversation: ${convError.message}`);
      return;
    }

    conversation = newConversation;

    if (!conversation) {
      const { data: existingConversation, error: existingError } = await supabase
        .from("conversations")
        .select("id, current_flow_id, current_node_id, metadata, contact_id, channel_sender_id, state_version, last_message_at")
        .eq("integration_id", integration.id)
        .eq("channel_sender_id", senderId)
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
      .eq("id", conversation!.id)
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

  // === STALE CONVERSATION RESET ===
  // Wenn eine Konversation einen aktiven Flow-State hat, aber seit >24h keine Aktivität
  // mehr war, wird der State zurückgesetzt bevor die neue Nachricht verarbeitet wird.
  // Verhindert: Bot setzt wochenlange Konversationen fort, nutzt alte Variablen,
  // fragt "Und wie viele Gäste?" obwohl der Gast längst vergessen hat warum er schrieb.
  const CONVERSATION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 Stunden
  if (conversation.current_flow_id && conversation.current_node_id) {
    const lastActivity = conversation.last_message_at
      ? new Date(conversation.last_message_at).getTime()
      : 0; // null = noch nie eine Nachricht geschrieben → Pflichtfeld fehlt → ebenfalls zurücksetzen
    const isStale = Date.now() - lastActivity > CONVERSATION_TIMEOUT_MS;

    if (isStale) {
      const staleFlowId = conversation.current_flow_id;
      const staleMeta = (conversation.metadata ?? {}) as ConversationMetadata;
      const resetMeta: ConversationMetadata = {
        ...staleMeta,
        variables: {},
        reservationId: undefined,
        flowCompleted: undefined,
      };

      try {
        const resetDone = await updateConversationState(
          {
            current_flow_id: null,
            current_node_id: null,
            metadata: resetMeta,
            status: "active",
          },
          "Failed to reset stale conversation"
        );

        if (resetDone) {
          conversation = {
            ...conversation,
            current_flow_id: null,
            current_node_id: null,
            metadata: resetMeta,
          };
          await reqLogger.info("webhook", "Stale conversation auto-reset", {
            metadata: {
              conversationId: conversation.id,
              staleFlowId,
              lastActivity: conversation.last_message_at,
              idleHours: Math.round((Date.now() - lastActivity) / 3_600_000),
            },
          });
        }
      } catch {
        // Non-critical: bei Konflikt (concurrent request) einfach weiter mit altem State
        await reqLogger.warn("webhook", "Stale conversation reset skipped due to concurrent update");
      }
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
    const payloadPart = quickReplyPayload ?? "";
    const timestampPart = event.timestamp ?? 0;
    const idSource = `${senderId}:${recipientId}:${timestampPart}:${payloadPart}`;
    const hash = crypto.createHash("sha256").update(idSource).digest("hex");
    instagramMessageId = `postback:${hash}`;
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

  // === ESCAPE HANDLER ===
  // Must run before any variable extraction or flow processing.
  // If a customer types an escape keyword while in an active flow,
  // we reset their conversation so they can start fresh — no dead ends.
  // Only fires on plain text messages (not quick reply button clicks).
  const ESCAPE_KEYWORDS = new Set([
    "stopp", "stop", "abbrechen", "abbruch", "neustart", "neu starten",
    "von vorne", "nochmal von vorne", "reset", "hilfe", "help",
    "beenden", "ende", "cancel", "quit",
  ]);

  const isInActiveFlow = Boolean(
    conversation.current_flow_id && conversation.current_node_id
  );
  const normalizedEscapeText = messageText.toLowerCase().trim();
  const isEscapeMessage =
    messageType === "text" &&
    messageText.length > 0 &&
    ESCAPE_KEYWORDS.has(normalizedEscapeText);

  if (isEscapeMessage && isInActiveFlow) {
    await reqLogger.info("webhook", "Escape keyword received — resetting conversation", {
      metadata: {
        keyword: normalizedEscapeText,
        previousFlowId: conversation.current_flow_id,
        previousNodeId: conversation.current_node_id,
      },
    });

    const resetMetadata: ConversationMetadata = {
      variables: {},
      reservationId: undefined,
      flowCompleted: undefined,
      reviewFlowId: undefined,
      reviewRequestId: undefined,
    };

    await updateConversationState(
      {
        current_flow_id: null,
        current_node_id: null,
        metadata: resetMetadata,
        status: "active",
      },
      "Failed to reset conversation on escape"
    );

    const triggerKeywords = await listTriggerKeywords(accountId, 3);
    const keywordHint =
      triggerKeywords.length > 0
        ? ` Schreib z.B. "${triggerKeywords[0]}" um neu zu starten.`
        : "";

    const escapeText = `Kein Problem! ✋ Ich habe den Vorgang abgebrochen.${keywordHint}`;

    const escapeQuickReplies = triggerKeywords.map((kw) => ({
      label: kw.charAt(0).toUpperCase() + kw.slice(1),
      payload: kw,
    }));

    const escapeSendResult = await sendInstagramMessage({
      recipientId: senderId,
      text: escapeText,
      quickReplies: escapeQuickReplies,
      accessToken,
    });

    if (!escapeSendResult.success) {
      await reqLogger.warn("webhook", "Failed to send escape confirmation", {
        metadata: { error: escapeSendResult.error, code: escapeSendResult.code },
      });
    }

    await markMessageProcessed();
    return;
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

  // Loaded once and reused for both the collects-slot check and free-text continuation,
  // eliminating a redundant DB round-trip per message in active conversations.
  let currentActiveFlow: { nodes: any; edges: any; metadata: any } | null = null;

  // Determine what the current node is collecting via the `collects` field (primary source of truth).
  // Falls back to node.id pattern matching for backwards-compatibility with older template flows.
  const overrideVariables: ExtractedVariables = {};
  if (messageText && conversation.current_flow_id && conversation.current_node_id) {
    const { data: loadedActiveFlow } = await supabase
      .from("flows")
      .select("nodes, edges, metadata")
      .eq("id", conversation.current_flow_id)
      .single();

    currentActiveFlow = loadedActiveFlow ?? null;

    let collectsKey: string | null = null;
    if (Array.isArray(currentActiveFlow?.nodes)) {
      const curNode = (currentActiveFlow.nodes as any[]).find(
        (n: any) => n.id === conversation.current_node_id
      );
      const rawCollects = String(curNode?.data?.collects ?? "").trim();
      // __custom_empty__ is the sentinel for an unnamed custom field — treat as no collects
      if (rawCollects && rawCollects !== "__custom_empty__") {
        collectsKey = rawCollects;
      }
    }

    // Backwards-compat: derive from node.id if no collects field set
    if (!collectsKey && conversation.current_node_id) {
      const nk = conversation.current_node_id.toLowerCase();
      if (nk.includes("name")) collectsKey = "name";
      else if (nk.includes("date")) collectsKey = "date";
      else if (nk.includes("time")) collectsKey = "time";
      else if (nk.includes("guest")) collectsKey = "guestCount";
      else if (nk.includes("phone") || nk.includes("telefon") || nk.includes("nummer")) collectsKey = "phone";
      else if (nk.includes("email") || nk.includes("mail")) collectsKey = "email";
      else if (nk.includes("special") || nk.includes("wunsch") || nk.includes("wünsch") || nk.includes("notiz")) collectsKey = "specialRequests";
      else if (nk.includes("review-rating")) collectsKey = "reviewRating";
      else if (nk.includes("review-feedback")) collectsKey = "reviewFeedback";
    }

    if (collectsKey) {
      const trimmedMessage = messageText.trim();
      const BUILTIN_COLLECTS = new Set([
        "name", "date", "time", "guestCount", "phone", "email",
        "specialRequests", "reviewRating", "reviewFeedback", "googleReviewUrl",
      ]);

      switch (collectsKey) {
        case "name": {
          const extractedName = extractName(trimmedMessage);
          if (extractedName) {
            overrideVariables.name = extractedName;
          } else if (looksLikeNameInput(trimmedMessage)) {
            overrideVariables.name = trimmedMessage;
          }
          break;
        }
        case "date": {
          const extractedDate = extractDate(trimmedMessage);
          if (extractedDate) overrideVariables.date = extractedDate;
          break;
        }
        case "time": {
          const extractedTime = extractTime(trimmedMessage, { allowDotWithoutUhr: true });
          if (extractedTime) overrideVariables.time = extractedTime;
          break;
        }
        case "guestCount": {
          const extractedCount = extractGuestCount(trimmedMessage);
          if (extractedCount) overrideVariables.guestCount = extractedCount;
          break;
        }
        case "phone": {
          const extractedPhone = extractVariables(trimmedMessage, {}).phone;
          if (extractedPhone) {
            overrideVariables.phone = extractedPhone;
          } else {
            const cleanedPhone = trimmedMessage.replace(/[\s\-\/\(\)]/g, "");
            if (/^\+?[\d]{6,15}$/.test(cleanedPhone)) {
              overrideVariables.phone = cleanedPhone;
            }
          }
          break;
        }
        case "email": {
          const emailMatch = trimmedMessage.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
          if (emailMatch) overrideVariables.email = emailMatch[1];
          break;
        }
        case "specialRequests": {
          if (trimmedMessage.length > 0) overrideVariables.specialRequests = trimmedMessage;
          break;
        }
        case "reviewRating": {
          const rating = extractReviewRating(trimmedMessage);
          if (rating) overrideVariables.reviewRating = rating;
          break;
        }
        case "reviewFeedback": {
          if (trimmedMessage.length > 0) overrideVariables.reviewFeedback = trimmedMessage;
          break;
        }
        default: {
          // Custom user-defined field (e.g. "lieblingsfarbe")
          if (!BUILTIN_COLLECTS.has(collectsKey) && mergedVariables[collectsKey] === undefined) {
            overrideVariables[collectsKey] = trimmedMessage;
          }
          break;
        }
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

    const newKeys = Object.keys(newVariables);
    const overrideKeys = Object.keys(overrideVariables);
    const mergedKeys = Object.keys(mergedVariables);
    await reqLogger.info("webhook", "Variables extracted from message", {
      metadata: { newKeys, overrideKeys, mergedKeys },
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

  // === CORRECTION HANDLER ===
  // Handles in-flow correction keywords so guests can fix typos without aborting the entire flow.
  //
  //  "nochmal"               → clears the variable the current node was collecting and re-asks
  //                            the same question (same current_node_id, no state advance).
  //  "ändern" / "korrigieren" → shows a summary of all collected variables as Quick Reply
  //                            buttons so the guest can pick which field to correct.
  //
  // Must run after currentActiveFlow is loaded (collects-check block above) so we can
  // inspect node.data.collects without an extra DB query.
  // Only fires on plain text messages while in an active flow.
  if (messageType === "text" && isInActiveFlow && currentActiveFlow && conversation.current_node_id && conversation.current_flow_id) {
    const correctionText = messageText.toLowerCase().trim();

    // ── "nochmal": clear last collected variable and re-ask the same question ──────────────────
    if (correctionText === "nochmal") {
      // Determine the collects key for the current node (same logic as the collects-check above)
      let redoCollectsKey: string | null = null;
      if (Array.isArray(currentActiveFlow.nodes)) {
        const curNode = (currentActiveFlow.nodes as any[]).find(
          (n: any) => n.id === conversation.current_node_id
        );
        const rawCollects = String(curNode?.data?.collects ?? "").trim();
        if (rawCollects && rawCollects !== "__custom_empty__") {
          redoCollectsKey = rawCollects;
        }
        // Backwards-compat: derive from node.id when collects field is absent
        if (!redoCollectsKey) {
          const nk = conversation.current_node_id.toLowerCase();
          if (nk.includes("name"))                                             redoCollectsKey = "name";
          else if (nk.includes("date"))                                        redoCollectsKey = "date";
          else if (nk.includes("time"))                                        redoCollectsKey = "time";
          else if (nk.includes("guest"))                                       redoCollectsKey = "guestCount";
          else if (nk.includes("phone") || nk.includes("telefon"))             redoCollectsKey = "phone";
          else if (nk.includes("email") || nk.includes("mail"))                redoCollectsKey = "email";
          else if (nk.includes("special") || nk.includes("wunsch"))            redoCollectsKey = "specialRequests";
        }
      }

      // Clear the variable this node was collecting
      const redoVars = { ...mergedVariables };
      if (redoCollectsKey) delete redoVars[redoCollectsKey];
      mergedVariables = redoVars;

      // Re-execute the current node (same question, same position — no state advance)
      const redoResponse = executeFlowNode(
        conversation.current_node_id,
        currentActiveFlow.nodes as any[],
        currentActiveFlow.edges as any[],
        conversation.current_flow_id,
        mergedVariables
      );

      if (redoResponse) {
        // Persist the cleared variable to DB (current_node_id stays unchanged)
        const redoMetadata: ConversationMetadata = { ...existingMetadata, variables: mergedVariables };
        const redoUpdated = await updateConversationState(
          { metadata: redoMetadata },
          "Failed to update metadata on redo"
        );
        if (!redoUpdated) {
          await reqLogger.warn("webhook", "Redo metadata update skipped due to version conflict");
        }

        const redoSendResult = await sendInstagramMessage({
          recipientId: senderId,
          text: redoResponse.text,
          quickReplies: redoResponse.quickReplies,
          accessToken,
        });
        if (!redoSendResult.success) {
          await reqLogger.warn("webhook", "Failed to send redo response", {
            metadata: { error: redoSendResult.error, code: redoSendResult.code },
          });
        }

        await reqLogger.info("webhook", "Redo: re-asking current question", {
          metadata: { nodeId: conversation.current_node_id, clearedField: redoCollectsKey ?? "(none)" },
        });

        await markMessageProcessed();
        return;
      }
    }

    // ── "ändern" / "korrigieren": show variable summary with per-field correction Quick Replies ─
    if (correctionText === "ändern" || correctionText === "korrigieren" || correctionText === "falsch") {
      // Labels kept intentionally short (≤ 11 chars) to stay well within Instagram's
      // Quick Reply label limit (~20 chars). Current values are shown in the message
      // text body instead — better UX, no truncation issues.
      const FIELD_LABELS: Record<string, string> = {
        name:            "👤 Name",
        date:            "📅 Datum",
        time:            "⏰ Uhrzeit",
        guestCount:      "👥 Personen",
        phone:           "📞 Telefon",
        email:           "📧 E-Mail",
        specialRequests: "📝 Notizen",
      };

      const collectedKeys = (Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>).filter(
        (key) => mergedVariables[key] !== undefined && mergedVariables[key] !== null && mergedVariables[key] !== ""
      );

      if (collectedKeys.length === 0) {
        await sendInstagramMessage({
          recipientId: senderId,
          text: "Es wurden noch keine Angaben gesammelt, die du ändern könntest.",
          quickReplies: [],
          accessToken,
        });
      } else {
        // Show current values in the message body, not in button labels
        const summaryLines = collectedKeys.map(
          (key) => `${FIELD_LABELS[key]}: ${formatVariableForCorrection(key, mergedVariables[key])}`
        );
        const amendText =
          `Deine bisherigen Angaben:\n\n${summaryLines.join("\n")}\n\nWas möchtest du ändern? ` +
          `Tippe 'nochmal' um die letzte Frage zu wiederholen.`;

        // Buttons are short field-name labels (≤ 11 chars each) — no label length issues
        const correctionReplies = collectedKeys.map((key) => ({
          label: FIELD_LABELS[key],
          payload: `__CORRECT_${key}__`,
        }));

        await sendInstagramMessage({
          recipientId: senderId,
          text: amendText,
          quickReplies: correctionReplies.slice(0, 12), // Instagram allows max 13 Quick Replies
          accessToken,
        });
      }

      await reqLogger.info("webhook", "Correction menu shown to user", {
        metadata: { fields: collectedKeys.map((key) => `__CORRECT_${key}__`) },
      });

      await markMessageProcessed();
      return;
    }
  }

  // Determine response
  let flowResponse = null;
  let matchedFlowId: string | null = conversation.current_flow_id;
  let matchedNodeId: string | null = null;
  let matchedFlowMetadata: FlowMetadata | null = null;
  let matchedFlowNodes: any[] | null = null;
  // True when the executed node is the confirmation/end step of a reservation flow
  let executedNodeIsConfirmation = false;

  // === HAUPTMENÜ HANDLER ===
  // User clicked the "Hauptmenü" button — go back to the flow's start node.
  // Handled before any other quick reply logic so the __HAUPTMENU__ payload
  // is never misinterpreted as a regular node-targeting payload.
  if (quickReplyPayload === "__HAUPTMENU__" && conversation.current_flow_id) {
    const { data: homeFlow } = await supabase
      .from("flows")
      .select("nodes, edges, triggers, metadata")
      .eq("id", conversation.current_flow_id)
      .single();

    if (homeFlow) {
      const homeTriggers = (homeFlow.triggers as FlowTrigger[]) ?? [];
      const homeStartNodeId =
        homeTriggers.find((t) => t.startNodeId)?.startNodeId ??
        deriveFallbackStartNodeId(homeFlow.nodes as any[], homeFlow.edges as any[]);

      if (homeStartNodeId) {
        // Clear variables so the user starts fresh from the main menu
        mergedVariables = {};
        flowResponse = executeFlowNode(
          homeStartNodeId,
          homeFlow.nodes as any[],
          homeFlow.edges as any[],
          conversation.current_flow_id,
          {}
        );
        matchedFlowId = conversation.current_flow_id;
        matchedNodeId = homeStartNodeId;
        matchedFlowMetadata = (homeFlow.metadata as FlowMetadata) ?? null;
        matchedFlowNodes = (homeFlow.nodes as any[]) ?? null;

        await reqLogger.info("webhook", "User returned to flow main menu", {
          metadata: {
            flowId: conversation.current_flow_id,
            startNodeId: homeStartNodeId,
          },
        });
      }
    }
  }

  // === CORRECT_FIELD QUICK REPLY HANDLER ===
  // Handles __CORRECT_<field>__ payloads generated by the "ändern" correction menu.
  // Finds the node responsible for collecting the requested field, clears the stored
  // variable, and re-executes that node — effectively sending the user back to that question.
  // This sets flowResponse + matchedNodeId so the normal send+state-persist path handles the rest.
  if (
    !flowResponse &&
    quickReplyPayload?.startsWith("__CORRECT_") &&
    quickReplyPayload.endsWith("__") &&
    isInActiveFlow &&
    conversation.current_flow_id
  ) {
    // Extract field name from payload, e.g. "__CORRECT_date__" → "date"
    const fieldToCorrect = quickReplyPayload.slice("__CORRECT_".length, -2);

    // Reuse the already-loaded flow (from collects-check block) or fetch it now
    let correctionFlowData: { nodes: any; edges: any; metadata: any } | null = currentActiveFlow;
    if (!correctionFlowData) {
      const { data: fetchedFlow } = await supabase
        .from("flows")
        .select("nodes, edges, metadata")
        .eq("id", conversation.current_flow_id)
        .single();
      correctionFlowData = fetchedFlow ?? null;
    }

    if (correctionFlowData && Array.isArray(correctionFlowData.nodes)) {
      const correctionNode = findCollectionNodeForField(correctionFlowData.nodes as any[], fieldToCorrect);

      if (correctionNode) {
        // Clear the variable being corrected
        const correctedVars = { ...mergedVariables };
        delete correctedVars[fieldToCorrect];
        mergedVariables = correctedVars;

        // Re-execute the node that collects this field (asks the question again)
        const correctionResponse = executeFlowNode(
          correctionNode.id,
          correctionFlowData.nodes as any[],
          correctionFlowData.edges as any[],
          conversation.current_flow_id,
          mergedVariables
        );

        if (correctionResponse) {
          flowResponse = correctionResponse;
          matchedFlowId = conversation.current_flow_id;
          matchedNodeId = correctionNode.id;
          matchedFlowMetadata = (correctionFlowData.metadata as FlowMetadata) ?? null;
          matchedFlowNodes = (correctionFlowData.nodes as any[]) ?? null;

          // Persist the cleared variable now; current_node_id is updated later by the normal send path
          const correctionMetadata: ConversationMetadata = { ...existingMetadata, variables: mergedVariables };
          const corrMetaUpdated = await updateConversationState(
            { metadata: correctionMetadata },
            "Failed to update metadata on field correction"
          );
          if (!corrMetaUpdated) {
            await reqLogger.warn("webhook", "Field correction metadata update skipped due to version conflict");
          }

          await reqLogger.info("webhook", "Field correction: re-asking for field", {
            metadata: { field: fieldToCorrect, correctionNodeId: correctionNode.id },
          });
        }
      } else {
        // No node found for this field — send a graceful fallback
        await reqLogger.warn("webhook", "No collection node found for field correction", {
          metadata: { field: fieldToCorrect, flowId: conversation.current_flow_id },
        });
        flowResponse = {
          text: "Dieses Feld konnte ich leider nicht finden. Tippe 'nochmal' um die letzte Frage zu wiederholen.",
          quickReplies: [],
          nextNodeId: null,
          isEndOfFlow: false,
        };
        matchedFlowId = conversation.current_flow_id;
        matchedNodeId = null;
      }
    }
  }

  // Handle quick reply continuation
  if (!flowResponse && quickReplyPayload && conversation.current_flow_id) {
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
        matchedFlowNodes = (flow.nodes as any[]) ?? null;

        // Detect if the target node is the confirmation/final step
        const targetNode = (flow.nodes as any[]).find((n: any) => n.id === parsed.nodeId);
        if (targetNode) {
          executedNodeIsConfirmation = nodeIsConfirmation(
            parsed.nodeId,
            String(targetNode.data?.label ?? ""),
            String(targetNode.data?.variant ?? ""),
          );
        }

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
    // Reuse the flow already loaded during the collects-slot check above — no extra DB query.
    const currentFlow = currentActiveFlow;

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
        matchedFlowNodes = (currentFlow.nodes as any[]) ?? null;

        // Detect if the executed node is a confirmation node
        const ftTargetNode = (currentFlow.nodes as any[]).find((n: any) => n.id === freeTextResult.executedNodeId);
        if (ftTargetNode) {
          executedNodeIsConfirmation = nodeIsConfirmation(
            freeTextResult.executedNodeId,
            String(ftTargetNode.data?.label ?? ""),
            String(ftTargetNode.data?.variant ?? ""),
          );
        }

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

  const resolveExistingReservation = async () => {
    const reservationContactId = contactId ?? conversation.contact_id ?? null;

    // Only consider reservations from yesterday onwards as "active".
    // Without this filter, a reservation from months ago that was never marked
    // "completed" would permanently block the guest from making a new booking.
    // -1 day buffer covers UTC/CET timezone edge cases (German accounts are UTC+1/+2).
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 1);
    const cutoffDateStr = cutoff.toISOString().split("T")[0]; // YYYY-MM-DD

    const buildReservationQuery = () =>
      supabase
        .from("reservations")
        .select(
          "id, guest_name, reservation_date, reservation_time, guest_count, status, google_event_id, google_calendar_id, contact_id, flow_id",
        )
        .eq("account_id", accountId)
        .in("status", ["pending", "confirmed"])
        .gte("reservation_date", cutoffDateStr)
        .order("created_at", { ascending: false })
        .limit(1);

    if (reservationContactId) {
      const { data } = await buildReservationQuery()
        .eq("contact_id", reservationContactId)
        .maybeSingle();
      if (data) {
        return data;
      }

      const { data: legacyReservation } = await buildReservationQuery()
        .is("contact_id", null)
        .eq("instagram_sender_id", senderId)
        .maybeSingle();
      if (legacyReservation) {
        const { error: backfillError } = await supabase
          .from("reservations")
          .update({ contact_id: reservationContactId })
          .eq("id", legacyReservation.id)
          .is("contact_id", null);

        if (backfillError) {
          await reqLogger.warn("webhook", "Failed to backfill reservation contact_id", {
            metadata: { reservationId: legacyReservation.id, error: backfillError.message },
          });
        }

        return { ...legacyReservation, contact_id: reservationContactId };
      }

      return null;
    }

    const { data: legacyReservation } = await buildReservationQuery()
      .is("contact_id", null)
      .eq("instagram_sender_id", senderId)
      .maybeSingle();
    return legacyReservation ?? null;
  };

  // If still no response, try to match a new flow.
  // Special reservation payloads (NEUE_RESERVIERUNG, CANCEL/KEEP/FORCE) must be handled
  // even when messageText is empty — some Meta client versions omit message.text on QR clicks.
  const hasSpecialReservationPayload =
    quickReplyPayload === "NEUE_RESERVIERUNG" ||
    quickReplyPayload === "FORCE_NEW_RESERVATION" ||
    quickReplyPayload === "CANCEL_EXISTING_RESERVATION" ||
    quickReplyPayload === "KEEP_EXISTING_RESERVATION";

  if (!flowResponse && (messageText || hasSpecialReservationPayload)) {
    // Handle special payloads for existing reservation management
    if (quickReplyPayload === "CANCEL_EXISTING_RESERVATION") {
      // User wants to cancel their existing reservation
      const existingRes = await resolveExistingReservation();

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

    // If user clicked "Neue Reservierung / Neuer Termin", find the best booking flow directly
    // without keyword matching — works for all verticals (Gastro, Fitness, Beauty).
    let forcedBookingFlow = null;
    if (forceNewReservation) {
      const previousReservationId = existingMetadata.reservationId;
      // Clear existing variables for fresh booking
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

      // Restart the exact flow that created the previous reservation (if known),
      // otherwise fall back to findBookingFlow scoring.
      // This is vertical-agnostic: works for any industry regardless of trigger keywords.
      const previousReservation = await resolveExistingReservation();
      if (previousReservation?.flow_id) {
        forcedBookingFlow = await loadFlowById(previousReservation.flow_id);
      }
      if (!forcedBookingFlow) {
        forcedBookingFlow = await findBookingFlow(accountId);
      }

      await reqLogger.info("webhook", "User requested new booking, metadata cleared", {
        metadata: {
          previousReservationId,
          strategy: previousReservation?.flow_id ? "exact_flow_restart" : "booking_flow_scoring",
          foundBookingFlow: forcedBookingFlow?.flowId ?? null,
          foundBookingFlowName: forcedBookingFlow?.flowName ?? null,
        },
      });
    }

    if (!forceNewReservation) {
      const existingReservation = await resolveExistingReservation();

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

    const matchedFlowCandidate = forcedBookingFlow ??
      (messageText ? await findMatchingFlow(accountId, messageText) : null);
    const canStartNewFlow =
      !conversation.current_flow_id ||
      !conversation.current_node_id ||
      forceNewReservation ||
      Boolean(matchedFlowCandidate);

    const matchedFlow = canStartNewFlow ? matchedFlowCandidate : null;

    if (matchedFlow) {
      if (conversation.current_flow_id && conversation.current_node_id && !forceNewReservation) {
        await reqLogger.info("webhook", "Starting new flow despite active conversation", {
          metadata: {
            previousFlowId: conversation.current_flow_id,
            previousNodeId: conversation.current_node_id,
            newFlowId: matchedFlow.flowId,
          },
        });
      }
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
      matchedFlowNodes = (matchedFlow.nodes as any[]) ?? null;

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

  // Inject available time slots when transitioning to a time-collection node
  if (
    flowResponse &&
    matchedNodeId &&
    typeof mergedVariables.date === "string" &&
    mergedVariables.date &&
    !executedNodeIsConfirmation
  ) {
    // Primary: check the node's `collects` field — works for all flows including UUID-based ones.
    // Fallback: legacy node-ID pattern matching for flows created before the `collects` field existed.
    const executedNode = matchedFlowNodes?.find((n: any) => n.id === matchedNodeId);
    const collectsTime = String(executedNode?.data?.collects ?? "").toLowerCase() === "time";
    const nodeIdLower = matchedNodeId.toLowerCase();
    const legacyPatternMatch =
      (nodeIdLower.includes("time") || nodeIdLower.includes("uhrzeit")) &&
      !nodeIdLower.includes("custom");
    const isTimeAskNode = collectsTime || legacyPatternMatch;

    if (isTimeAskNode) {
      try {
        const availableSlots = await getAvailableSlotsForDate(accountId, mergedVariables.date);
        // null = no Google Calendar connected → skip injection, leave flow text unchanged
        if (availableSlots === null) {
          // intentional no-op: operator hasn't connected Google Calendar
        } else if (availableSlots.length > 0 && flowResponse.quickReplies.length > 0) {
          // Find the payload used by standard time buttons (pointing to the next step)
          const nextPayload = flowResponse.quickReplies.find(
            (qr) => !qr.label.toLowerCase().includes("andere"),
          )?.payload;

          if (nextPayload) {
            // Instagram allows max 13 quick replies; reserve 1 for "andere Uhrzeit"
            const MAX_SLOT_BUTTONS = 10;
            const slotReplies = availableSlots.slice(0, MAX_SLOT_BUTTONS).map((time) => ({
              label: `${time} Uhr`,
              payload: nextPayload,
            }));

            // Keep "Andere Uhrzeit" as last option
            const customOption = flowResponse.quickReplies.find((qr) =>
              qr.label.toLowerCase().includes("andere"),
            );
            if (customOption) slotReplies.push(customOption);

            const [y, m, d] = mergedVariables.date.split("-");
            const formattedDate = `${d}.${m}.${y}`;

            const shownSlots = availableSlots.slice(0, MAX_SLOT_BUTTONS);
            flowResponse = {
              ...flowResponse,
              text: `⏰ Für ${formattedDate} sind folgende Zeiten frei:\n\n${shownSlots.map((t) => `• ${t} Uhr`).join("\n")}\n\nBitte wähle eine Zeit:`,
              quickReplies: slotReplies,
            };

            await reqLogger.info("webhook", "Injected available slots for time selection", {
              metadata: { date: mergedVariables.date, slots: shownSlots },
            });
          }
        } else if (availableSlots.length === 0) {
          // No slots available — keep original quick replies, just add info to text
          flowResponse = {
            ...flowResponse,
            text: `${flowResponse.text}\n\n⚠️ Hinweis: Für dieses Datum sind momentan keine freien Zeiten im Kalender verfügbar. Bitte wähle eine Zeit oder nenne ein anderes Datum.`,
          };
        }
      } catch (_slotError) {
        // On any error: silently fall through with original quick replies
      }
    }
  }

  // === HAUPTMENÜ BUTTON INJECTION ===
  // Appends a "Hauptmenü" quick reply to every non-terminal flow response.
  // This gives users a visible, one-tap way out of any mid-flow step without
  // needing to know an escape keyword.
  //
  // Not added when:
  // - Flow has ended (isEndOfFlow) — no more interaction expected
  // - No active flow — button would have no target to return to
  // - Already 13 quick replies — Instagram's hard limit
  // - Button already present — avoid duplicates on re-renders
  // - Executed node is the confirmation step — the flow is completing, don't interrupt
  if (
    flowResponse &&
    !flowResponse.isEndOfFlow &&
    matchedFlowId &&
    !executedNodeIsConfirmation &&
    flowResponse.quickReplies.length < 13 &&
    !flowResponse.quickReplies.some((qr) => qr.payload === "__HAUPTMENU__")
  ) {
    flowResponse = {
      ...flowResponse,
      quickReplies: [
        ...flowResponse.quickReplies,
        { label: "🏠 Hauptmenü", payload: "__HAUPTMENU__" },
      ],
    };
  }

  // === FALLBACK: Kein Flow hat gematcht und kein aktiver Flow ===
  // Verhindert das "Bot schweigt"-Problem. Nur für Text- und Quick-Reply-Nachrichten
  // (Bilder werden still ignoriert — niemand erwartet eine Antwort auf ein Foto).
  // Respektiert die Account-Einstellung "fallback_enabled" (Standard: true).
  let fallbackEnabled = true;
  if (!flowResponse && messageType !== "image") {
    const { data: accountSettings } = await supabase
      .from("accounts")
      .select("settings")
      .eq("id", accountId)
      .single();
    const settings = (accountSettings?.settings ?? {}) as Record<string, unknown>;
    fallbackEnabled = settings?.fallback_enabled !== false;
  }

  if (!flowResponse && messageType !== "image" && fallbackEnabled) {
    const fallbackKeywords = await listTriggerKeywords(accountId, 6);

    let fallbackText: string;
    if (fallbackKeywords.length > 0) {
      const keywordHints = fallbackKeywords.slice(0, 3).map((k) => `"${k}"`).join(", ");
      fallbackText = `Hallo! 👋 Das habe ich leider nicht verstanden. Schreib z.B. ${keywordHints} und ich helfe dir gerne weiter.`;
    } else {
      fallbackText =
        "Hallo! 👋 Das habe ich leider nicht verstanden. Bitte versuche es mit einer anderen Nachricht.";
    }

    const fallbackQuickReplies = fallbackKeywords.map((kw) => ({
      label: kw.charAt(0).toUpperCase() + kw.slice(1),
      payload: kw,
    }));

    flowResponse = {
      text: fallbackText,
      quickReplies: fallbackQuickReplies,
      nextNodeId: null,
      isEndOfFlow: false,
    };

    await reqLogger.info("webhook", "No flow matched — sending fallback response", {
      metadata: { messageText, fallbackKeywords },
    });
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
          ? confirmationPayloads.some((p) =>
              quickReplyPayload.toLowerCase().includes(p.toLowerCase()),
            )
          : false;

        const confirmationNodeTokens = [
          "confirm",
          "confirmed",
          "bestätig",
          "bestaetig",
          "absenden",
          "buchen",
          "final",
          "done",
        ];
        const isConfirmationNode = confirmationNodeTokens.some((token) =>
          matchedNodeIdLower.includes(token),
        );

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
          isConfirmationNode ||
          executedNodeIsConfirmation ||
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
            isConfirmationNode,
            executedNodeIsConfirmation,
            looksLikeFinalStep,
            hasAllReservationData,
            matchedNodeId,
            hasQuickReplyPayload: Boolean(quickReplyPayload),
            shouldStoreSubmission,
            shouldCreateReservation,
            outputType,
            outputRequiredFields: outputConfig.requiredFields,
            canCreate: canCreateReservation(reservationVariables, outputConfig.requiredFields),
            missingFields: missingReservationFields,
            variableKeys: Object.keys(reservationVariables),
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
          // Guard: userId must be non-null — reservations.user_id is NOT NULL in the DB schema.
          // If we reach here with userId = null, the insert would crash. Instead, surface a
          // guest-facing error and return early so the confirmation message is not sent.
          if (!userId) {
            await reqLogger.error("webhook", "Cannot create reservation: userId is null after all fallbacks", {
              metadata: { accountId, flowId: matchedFlowId },
            });
            const technicalErrorMsg =
              "Es gab ein technisches Problem. Bitte versuche es erneut oder kontaktiere uns direkt.";
            await sendInstagramMessage({
              recipientId: senderId,
              text: technicalErrorMsg,
              quickReplies: [],
              accessToken,
            });
            return;
          }

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

            // Notify account owner — fire-and-forget, never blocks the response
            void sendReservationNotification(
              accountId,
              reservationVariables,
              reservationResult.reservationId
            );

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
      metadata: { messageLength: messageText.length },
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
      // Conflict errors get retried — don't notify the guest yet
      allowMarkProcessed = false;
    } else {
      // Best-effort: notify the guest using the already-loaded accessToken.
      // This works even if the original error was a DB failure, because
      // accessToken was decrypted from memory before the main processing block.
      try {
        await sendInstagramMessage({
          recipientId: senderId,
          text: "Es tut mir leid, es gab einen technischen Fehler. Bitte versuche es in einem Moment erneut.",
          quickReplies: [],
          accessToken,
        });
      } catch {
        // Silently ignore — the original error is already logged by the outer handler
      }
    }
    throw error;
  } finally {
    if (allowMarkProcessed) {
      await markMessageProcessed();
    }
  }
}
