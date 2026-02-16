import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies the X-Hub-Signature-256 header from Meta webhooks.
 * Uses HMAC-SHA256 with the META_APP_SECRET as key.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) {
    return false;
  }

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("META_APP_SECRET is not configured");
    return false;
  }

  // Signature format: "sha256=<hex_digest>"
  const expectedPrefix = "sha256=";
  if (!signature.startsWith(expectedPrefix)) {
    return false;
  }

  const providedHash = signature.slice(expectedPrefix.length);

  // Calculate expected hash
  const hmac = createHmac("sha256", appSecret);
  hmac.update(payload, "utf8");
  const expectedHash = hmac.digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  try {
    const providedBuffer = Buffer.from(providedHash, "hex");
    const expectedBuffer = Buffer.from(expectedHash, "hex");

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verifies the hub.verify_token for webhook subscription verification.
 */
export function verifySubscriptionToken(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN ?? process.env.META_APP_SECRET;
  if (!expectedToken) {
    console.error("META_WEBHOOK_VERIFY_TOKEN (and META_APP_SECRET fallback) is not configured");
    return false;
  }

  // Use timing-safe comparison
  try {
    const providedBuffer = Buffer.from(token, "utf8");
    const expectedBuffer = Buffer.from(expectedToken, "utf8");

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
