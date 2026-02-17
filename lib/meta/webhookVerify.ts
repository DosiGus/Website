import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies the X-Hub-Signature-256 header from Meta webhooks.
 * Tries META_APP_SECRET first, then META_INSTAGRAM_APP_SECRET.
 * Instagram product webhooks may be signed with the Instagram App Secret
 * instead of the main Meta App Secret.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) {
    return false;
  }

  // Signature format: "sha256=<hex_digest>"
  const expectedPrefix = "sha256=";
  if (!signature.startsWith(expectedPrefix)) {
    return false;
  }

  const providedHash = signature.slice(expectedPrefix.length);

  // Try both secrets: Meta App Secret and Instagram App Secret
  const secrets = [
    process.env.META_APP_SECRET,
    process.env.META_INSTAGRAM_APP_SECRET,
  ].filter((s): s is string => Boolean(s));

  if (secrets.length === 0) {
    console.error("Neither META_APP_SECRET nor META_INSTAGRAM_APP_SECRET is configured");
    return false;
  }

  return secrets.some((secret) => {
    try {
      const hmac = createHmac("sha256", secret);
      hmac.update(payload, "utf8");
      const expectedHash = hmac.digest("hex");

      const providedBuffer = Buffer.from(providedHash, "hex");
      const expectedBuffer = Buffer.from(expectedHash, "hex");

      if (providedBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return timingSafeEqual(providedBuffer, expectedBuffer);
    } catch {
      return false;
    }
  });
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
 * Accepts META_WEBHOOK_VERIFY_TOKEN only.
 */
export function verifySubscriptionToken(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!expected) {
    console.error("META_WEBHOOK_VERIFY_TOKEN is not configured");
    return false;
  }

  return safeCompare(token, expected);
}
