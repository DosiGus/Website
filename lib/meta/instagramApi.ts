import {
  META_GRAPH_BASE,
  InstagramSendMessageRequest,
  InstagramSendMessageResponse,
  InstagramApiError,
  InstagramQuickReply,
} from "./types";
import { logger } from "../logger";

export type SendMessageOptions = {
  recipientId: string;
  text: string;
  quickReplies?: Array<{ label: string; payload: string }>;
  accessToken: string;
};

export type SendImageOptions = {
  recipientId: string;
  imageUrl: string;
  accessToken: string;
};

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: number };

/**
 * Sends a text message via Instagram Messaging API.
 * Optionally includes quick reply buttons.
 */
export async function sendInstagramMessage(
  options: SendMessageOptions
): Promise<ApiResult<InstagramSendMessageResponse>> {
  const { recipientId, text, quickReplies, accessToken } = options;

  const messagePayload: InstagramSendMessageRequest["message"] = {
    text,
  };

  if (quickReplies && quickReplies.length > 0) {
    // Instagram allows max 13 quick replies
    const limitedReplies = quickReplies.slice(0, 13);
    messagePayload.quick_replies = limitedReplies.map(
      (qr): InstagramQuickReply => ({
        content_type: "text",
        title: qr.label.slice(0, 20), // Max 20 chars for title
        payload: qr.payload.slice(0, 1000), // Max 1000 chars for payload
      })
    );
  }

  const requestBody: InstagramSendMessageRequest = {
    recipient: { id: recipientId },
    message: messagePayload,
  };

  return sendToInstagramApi(requestBody, accessToken);
}

/**
 * Sends an image message via Instagram Messaging API.
 */
export async function sendInstagramImageMessage(
  options: SendImageOptions
): Promise<ApiResult<InstagramSendMessageResponse>> {
  const { recipientId, imageUrl, accessToken } = options;

  const requestBody: InstagramSendMessageRequest = {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: imageUrl,
          is_reusable: true,
        },
      },
    },
  };

  return sendToInstagramApi(requestBody, accessToken);
}

/**
 * Sends both text and image in sequence (image first, then text).
 */
export async function sendInstagramMessageWithImage(options: {
  recipientId: string;
  imageUrl: string;
  text: string;
  quickReplies?: Array<{ label: string; payload: string }>;
  accessToken: string;
}): Promise<ApiResult<InstagramSendMessageResponse>> {
  const { recipientId, imageUrl, text, quickReplies, accessToken } = options;

  // Send image first
  const imageResult = await sendInstagramImageMessage({
    recipientId,
    imageUrl,
    accessToken,
  });

  if (!imageResult.success) {
    return imageResult;
  }

  // Then send text with quick replies
  return sendInstagramMessage({
    recipientId,
    text,
    quickReplies,
    accessToken,
  });
}

/**
 * Internal function to make API calls to Instagram.
 */
async function sendToInstagramApi(
  body: InstagramSendMessageRequest,
  accessToken: string
): Promise<ApiResult<InstagramSendMessageResponse>> {
  const url = `${META_GRAPH_BASE}/me/messages?access_token=${accessToken}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as InstagramApiError;
      const errorMessage = errorData.error?.message || "Unknown API error";
      const errorCode = errorData.error?.code;

      await logger.error("integration", `Instagram API error: ${errorMessage}`, {
        metadata: {
          code: errorCode,
          subcode: errorData.error?.error_subcode,
          type: errorData.error?.type,
          recipientId: body.recipient.id,
        },
      });

      // Handle specific error codes
      if (errorCode === 190) {
        return {
          success: false,
          error: "Access token expired or invalid",
          code: errorCode,
        };
      }

      if (errorCode === 10 || errorCode === 100) {
        return {
          success: false,
          error: "Permission denied or invalid recipient",
          code: errorCode,
        };
      }

      // Rate limiting
      if (errorCode === 4 || errorCode === 17 || errorCode === 341) {
        return {
          success: false,
          error: "Rate limit exceeded, please try again later",
          code: errorCode,
        };
      }

      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }

    return {
      success: true,
      data: data as InstagramSendMessageResponse,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    await logger.error("integration", `Instagram API request failed: ${message}`);

    return {
      success: false,
      error: message,
    };
  }
}
