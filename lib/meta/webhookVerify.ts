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
 * Timing-safe string comparison helper.
 */
function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Verifies the hub.verify_token for webhook subscription verification.
 * Accepts META_WEBHOOK_VERIFY_TOKEN or META_APP_SECRET (for re-subscription).
 */
export function verifySubscriptionToken(token: string | null): boolean {
  if (!token) {
    return false;
  }

  // Accept either the dedicated verify token OR the app secret
  // This allows re-subscribing the webhook using the app secret
  const candidates = [
    process.env.META_WEBHOOK_VERIFY_TOKEN,
    process.env.META_APP_SECRET,
  ].filter((t): t is string => Boolean(t));

  if (candidates.length === 0) {
    console.error("Neither META_WEBHOOK_VERIFY_TOKEN nor META_APP_SECRET is configured");
    return false;
  }

  return candidates.some((expected) => safeCompare(token, expected));
}
