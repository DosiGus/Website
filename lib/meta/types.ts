// Centralized Meta/Instagram types and constants

export const META_GRAPH_VERSION = "v21.0";
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export const META_PERMISSIONS = [
  "instagram_basic",
  "instagram_manage_messages",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_messaging",
] as const;

export type MetaTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type MetaLongLivedTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type MetaPageData = {
  id: string;
  name: string;
  access_token: string;
};

export type MetaAccountsResponse = {
  data: MetaPageData[];
};

export type MetaInstagramBusinessAccountResponse = {
  instagram_business_account?: {
    id: string;
  };
};

export type MetaInstagramUserResponse = {
  id: string;
  name?: string;
  username?: string;
};

export type IntegrationStatus = {
  provider: string;
  status: string;
  account_name: string | null;
  instagram_id: string | null;
  instagram_username: string | null;
  page_id: string | null;
  expires_at: string | null;
  updated_at: string | null;
  google_review_url: string | null;
};

// Instagram Webhook Types
export type InstagramWebhookEntry = {
  id: string;
  time: number;
  messaging: InstagramMessagingEvent[];
};

export type InstagramWebhookPayload = {
  object: "instagram";
  entry: InstagramWebhookEntry[];
};

export type InstagramMessagingEvent = {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: InstagramIncomingMessage;
  postback?: InstagramPostback;
};

export type InstagramIncomingMessage = {
  mid: string;
  text?: string;
  quick_reply?: {
    payload: string;
  };
  attachments?: InstagramAttachment[];
};

export type InstagramAttachment = {
  type: "image" | "video" | "audio" | "file";
  payload: {
    url: string;
  };
};

export type InstagramPostback = {
  mid: string;
  payload: string;
  title: string;
};

// Instagram Send API Types
export type InstagramQuickReply = {
  content_type: "text";
  title: string;
  payload: string;
};

export type InstagramSendMessageRequest = {
  recipient: { id: string };
  message: {
    text?: string;
    attachment?: {
      type: "image";
      payload: {
        url: string;
        is_reusable?: boolean;
      };
    };
    quick_replies?: InstagramQuickReply[];
  };
};

export type InstagramSendMessageResponse = {
  recipient_id: string;
  message_id: string;
};

export type InstagramApiError = {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
};
