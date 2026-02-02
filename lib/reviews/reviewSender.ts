import { createSupabaseServerClient } from "../supabaseServerClient";
import { fallbackTemplates } from "../flowTemplates";
import { executeFlowNode } from "../webhook/flowExecutor";
import { sendInstagramMessage } from "../meta/instagramApi";
import { ConversationMetadata, ConversationVariables } from "../flowTypes";
import { logger } from "../logger";

const REVIEW_TEMPLATE_ID = "template-google-review";
const REVIEW_START_NODE_ID = "review-rating";

type ReviewFlowData = {
  flowId: string;
  nodes: any[];
  edges: any[];
};

type ReviewRequestStatus =
  | "pending"
  | "sent"
  | "rated"
  | "completed"
  | "skipped"
  | "failed";

export async function ensureReviewFlow(userId: string): Promise<ReviewFlowData> {
  const supabase = createSupabaseServerClient();

  const { data: activeFlow, error: activeError } = await supabase
    .from("flows")
    .select("id, nodes, edges, metadata, status, updated_at")
    .eq("user_id", userId)
    .eq("status", "Aktiv")
    .contains("metadata", { reviewFlow: true })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeError) {
    throw new Error(`Failed to load review flow: ${activeError.message}`);
  }

  if (activeFlow) {
    return {
      flowId: activeFlow.id,
      nodes: activeFlow.nodes as any[],
      edges: activeFlow.edges as any[],
    };
  }

  const { data: existingFlow, error: flowError } = await supabase
    .from("flows")
    .select("id, nodes, edges, metadata, updated_at")
    .eq("user_id", userId)
    .contains("metadata", { reviewFlow: true })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (flowError) {
    throw new Error(`Failed to load review flow: ${flowError.message}`);
  }

  if (existingFlow) {
    return {
      flowId: existingFlow.id,
      nodes: existingFlow.nodes as any[],
      edges: existingFlow.edges as any[],
    };
  }

  const template = fallbackTemplates.find((tpl) => tpl.id === REVIEW_TEMPLATE_ID);
  if (!template) {
    throw new Error("Review flow template not found.");
  }

  const metadata = {
    ...(template.metadata ?? {}),
    reviewFlow: true,
    reviewTemplateId: template.id,
  };

  const { data: newFlow, error: createError } = await supabase
    .from("flows")
    .insert({
      user_id: userId,
      name: template.name,
      nodes: template.nodes,
      edges: template.edges,
      triggers: template.triggers ?? [],
      metadata,
      status: "Aktiv",
    })
    .select("id, nodes, edges")
    .single();

  if (createError || !newFlow) {
    throw new Error(`Failed to create review flow: ${createError?.message ?? "Unknown error"}`);
  }

  return {
    flowId: newFlow.id,
    nodes: newFlow.nodes as any[],
    edges: newFlow.edges as any[],
  };
}

export async function sendReviewRequestForReservation(
  reservationId: string,
  reason: string,
) {
  const supabase = createSupabaseServerClient();

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select(
      "id, user_id, conversation_id, instagram_sender_id, reservation_date, reservation_time, status",
    )
    .eq("id", reservationId)
    .single();

  if (reservationError || !reservation) {
    await logger.warn("system", "Review request skipped: reservation not found", {
      metadata: { reservationId, reason, error: reservationError?.message },
    });
    return { success: false, status: "missing_reservation" };
  }

  if (["cancelled", "no_show"].includes(reservation.status)) {
    await logger.info("system", "Review request skipped: reservation cancelled/no_show", {
      metadata: { reservationId, status: reservation.status, reason },
    });
    return { success: false, status: "cancelled" };
  }

  if (!reservation.instagram_sender_id) {
    await logger.warn("system", "Review request skipped: missing instagram sender id", {
      metadata: { reservationId, reason },
    });
    return { success: false, status: "missing_sender" };
  }

  const conversationId =
    reservation.conversation_id ||
    (await findConversationId(reservation.user_id, reservation.instagram_sender_id));

  if (!conversationId) {
    await logger.warn("system", "Review request skipped: conversation not found", {
      metadata: { reservationId, reason },
    });
    return { success: false, status: "missing_conversation" };
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, integration_id, metadata")
    .eq("id", conversationId)
    .single();

  if (conversationError || !conversation) {
    await logger.warn("system", "Review request skipped: conversation load failed", {
      metadata: { reservationId, conversationId, reason, error: conversationError?.message },
    });
    return { success: false, status: "missing_conversation" };
  }

  const { data: integration, error: integrationError } = await supabase
    .from("integrations")
    .select("id, access_token, instagram_id, google_review_url")
    .eq("id", conversation.integration_id)
    .single();

  if (integrationError || !integration?.access_token) {
    await logger.warn("system", "Review request skipped: integration not ready", {
      metadata: {
        reservationId,
        conversationId,
        integrationId: conversation.integration_id,
        reason,
        error: integrationError?.message,
      },
    });
    return { success: false, status: "missing_integration" };
  }

  if (!integration.google_review_url) {
    await upsertReviewRequest({
      supabase,
      reservationId: reservation.id,
      userId: reservation.user_id,
      conversationId: conversation.id,
      integrationId: integration.id,
      flowId: null,
      status: "skipped",
    });

    await logger.warn("system", "Review request skipped: google review url missing", {
      metadata: { reservationId, reason },
    });
    return { success: false, status: "missing_review_url" };
  }

  const existingRequest = await loadReviewRequest(supabase, reservation.id);
  if (existingRequest && ["sent", "rated", "completed", "skipped"].includes(existingRequest.status)) {
    await logger.info("system", "Review request already sent", {
      metadata: { reservationId, reviewRequestId: existingRequest.id, status: existingRequest.status },
    });
    return { success: true, status: "already_sent", reviewRequestId: existingRequest.id };
  }

  const reviewFlow = await ensureReviewFlow(reservation.user_id);
  const reviewRequest = await upsertReviewRequest({
    supabase,
    reservationId: reservation.id,
    userId: reservation.user_id,
    conversationId: conversation.id,
    integrationId: integration.id,
    flowId: reviewFlow.flowId,
    status: "pending",
  });

  const conversationMetadata = (conversation.metadata || {}) as ConversationMetadata;
  const mergedVariables: ConversationVariables = {
    ...(conversationMetadata.variables ?? {}),
    googleReviewUrl: integration.google_review_url,
  };

  const flowResponse = executeFlowNode(
    REVIEW_START_NODE_ID,
    reviewFlow.nodes,
    reviewFlow.edges,
    reviewFlow.flowId,
    mergedVariables,
  );

  if (!flowResponse) {
    await updateReviewRequestStatus(supabase, reviewRequest.id, "failed");
    await logger.error("system", "Review flow execution failed", {
      metadata: { reservationId, reviewRequestId: reviewRequest.id },
    });
    return { success: false, status: "flow_failed" };
  }

  const sendResult = await sendInstagramMessage({
    recipientId: reservation.instagram_sender_id ?? "",
    text: flowResponse.text,
    quickReplies: flowResponse.quickReplies,
    accessToken: integration.access_token,
  });

  if (!sendResult.success) {
    await updateReviewRequestStatus(supabase, reviewRequest.id, "failed");
    await logger.error("system", `Review request send failed: ${sendResult.error}`, {
      metadata: { reservationId, reviewRequestId: reviewRequest.id },
    });
    return { success: false, status: "send_failed" };
  }

  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    direction: "outgoing",
    message_type: flowResponse.quickReplies.length > 0 ? "quick_reply" : "text",
    content: flowResponse.text,
    instagram_message_id: sendResult.data.message_id,
    flow_id: reviewFlow.flowId,
    node_id: REVIEW_START_NODE_ID,
  });

  const updatedMetadata: ConversationMetadata = {
    ...conversationMetadata,
    variables: mergedVariables,
    reviewFlowId: reviewFlow.flowId,
    reviewRequestId: reviewRequest.id,
  };

  await supabase
    .from("conversations")
    .update({
      current_flow_id: reviewFlow.flowId,
      current_node_id: REVIEW_START_NODE_ID,
      last_message_at: new Date().toISOString(),
      status: "active",
      metadata: updatedMetadata,
    })
    .eq("id", conversation.id);

  const sentAt = new Date().toISOString();
  await supabase
    .from("review_requests")
    .update({ status: "sent", sent_at: sentAt, updated_at: sentAt })
    .eq("id", reviewRequest.id);

  await logger.info("system", "Review request sent", {
    metadata: {
      reservationId,
      reviewRequestId: reviewRequest.id,
      flowId: reviewFlow.flowId,
      reason,
    },
  });

  return { success: true, status: "sent", reviewRequestId: reviewRequest.id };
}

async function findConversationId(userId: string, instagramSenderId: string | null) {
  if (!instagramSenderId) return null;
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("instagram_sender_id", instagramSenderId)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

async function loadReviewRequest(supabase: ReturnType<typeof createSupabaseServerClient>, reservationId: string) {
  const { data, error } = await supabase
    .from("review_requests")
    .select("id, status")
    .eq("reservation_id", reservationId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as { id: string; status: ReviewRequestStatus } | null;
}

async function upsertReviewRequest(params: {
  supabase: ReturnType<typeof createSupabaseServerClient>;
  reservationId: string;
  userId: string;
  conversationId: string;
  integrationId: string;
  flowId: string | null;
  status: ReviewRequestStatus;
}) {
  const { supabase, reservationId, userId, conversationId, integrationId, flowId, status } = params;

  const { data, error } = await supabase
    .from("review_requests")
    .upsert(
      {
        reservation_id: reservationId,
        user_id: userId,
        conversation_id: conversationId,
        integration_id: integrationId,
        flow_id: flowId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "reservation_id" },
    )
    .select("id, status")
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert review request: ${error?.message ?? "Unknown error"}`);
  }

  return data as { id: string; status: ReviewRequestStatus };
}

async function updateReviewRequestStatus(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  reviewRequestId: string,
  status: ReviewRequestStatus,
) {
  await supabase
    .from("review_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", reviewRequestId);
}
