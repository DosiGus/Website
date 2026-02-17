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
  | { success: true; data: T; attempts?: number }
  | { success: false; error: string; code?: number; retryable?: boolean; attempts?: number };

const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 500;
const RETRYABLE_ERROR_CODES = new Set([4, 17, 341, 2]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || (status >= 500 && status < 600);
}

function getRetryDelayMs(attempt: number, retryAfterHeader: string | null) {
  if (retryAfterHeader) {
    const retryAfterSeconds = Number.parseInt(retryAfterHeader, 10);
    if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
      return retryAfterSeconds * 1000;
    }
  }
  const backoff = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
  const jitter = Math.floor(Math.random() * 200);
  return backoff + jitter;
}

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
  const url = `${META_GRAPH_BASE}/me/messages`;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorData = data as InstagramApiError | null;
        const errorMessage = errorData?.error?.message || "Unknown API error";
        const errorCode = errorData?.error?.code;
        const retryable =
          isRetryableStatus(response.status) ||
          (typeof errorCode === "number" && RETRYABLE_ERROR_CODES.has(errorCode));

        if (!retryable || attempt === MAX_RETRY_ATTEMPTS) {
          await logger.error("integration", `Instagram API error: ${errorMessage}`, {
            metadata: {
              code: errorCode,
              subcode: errorData?.error?.error_subcode,
              type: errorData?.error?.type,
              recipientId: body.recipient.id,
              attempts: attempt,
              status: response.status,
              retryable,
            },
          });

          if (errorCode === 190) {
            return {
              success: false,
              error: "Access token expired or invalid",
              code: errorCode,
              retryable: false,
              attempts: attempt,
            };
          }

          if (errorCode === 10 || errorCode === 100) {
            return {
              success: false,
              error: "Permission denied or invalid recipient",
              code: errorCode,
              retryable: false,
              attempts: attempt,
            };
          }

          if (errorCode === 4 || errorCode === 17 || errorCode === 341) {
            return {
              success: false,
              error: "Rate limit exceeded, please try again later",
              code: errorCode,
              retryable: true,
              attempts: attempt,
            };
          }

          return {
            success: false,
            error: errorMessage,
            code: errorCode,
            retryable,
            attempts: attempt,
          };
        }

        await logger.warn("integration", "Instagram API retry scheduled", {
          metadata: {
            code: errorCode,
            recipientId: body.recipient.id,
            attempt,
            status: response.status,
          },
        });

        await sleep(getRetryDelayMs(attempt, response.headers.get("retry-after")));
        continue;
      }

      return {
        success: true,
        data: data as InstagramSendMessageResponse,
        attempts: attempt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error";
      const isLastAttempt = attempt === MAX_RETRY_ATTEMPTS;

      if (isLastAttempt) {
        await logger.error("integration", `Instagram API request failed: ${message}`, {
          metadata: { recipientId: body.recipient.id, attempts: attempt },
        });
        return {
          success: false,
          error: message,
          retryable: true,
          attempts: attempt,
        };
      }

      await logger.warn("integration", "Instagram API request failed, retrying", {
        metadata: { recipientId: body.recipient.id, attempt, error: message },
      });
      await sleep(getRetryDelayMs(attempt, null));
    }
  }

  return {
    success: false,
    error: "Retry attempts exhausted",
    retryable: false,
    attempts: MAX_RETRY_ATTEMPTS,
  };
}
