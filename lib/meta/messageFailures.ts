import { createSupabaseServerClient } from "../supabaseServerClient";

type FailureInsert = {
  integrationId: string | null;
  conversationId: string | null;
  recipientId: string | null;
  messageType: "text" | "quick_reply" | "image";
  content: string | null;
  quickReplies?: Array<{ label: string; payload: string }>;
  errorCode?: number;
  errorMessage: string;
  retryable?: boolean;
  attempts?: number;
  flowId?: string | null;
  nodeId?: string | null;
};

export async function recordMessageFailure(input: FailureInsert) {
  const supabase = createSupabaseServerClient();
  const {
    integrationId,
    conversationId,
    recipientId,
    messageType,
    content,
    quickReplies,
    errorCode,
    errorMessage,
    retryable,
    attempts,
    flowId,
    nodeId,
  } = input;

  await supabase.from("message_failures").insert({
    integration_id: integrationId,
    conversation_id: conversationId,
    recipient_id: recipientId,
    provider: "meta",
    direction: "outgoing",
    message_type: messageType,
    content,
    quick_replies: quickReplies ?? null,
    error_code: errorCode ?? null,
    error_message: errorMessage,
    retryable: retryable ?? false,
    attempts: attempts ?? null,
    flow_id: flowId ?? null,
    node_id: nodeId ?? null,
  });
}
