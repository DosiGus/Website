/**
 * Simple in-memory rate limiter for API routes.
 *
 * Note: This works for single-server deployments. For multi-server/edge
 * deployments, consider using Upstash Redis or similar.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupOldEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const keysToDelete: string[] = [];
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => rateLimitStore.delete(key));
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request should be rate limited.
 *
 * @param identifier - Unique identifier for the rate limit (e.g., userId, IP)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and headers
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupOldEntries();

  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // If no entry or window has expired, create new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Increment count
  entry.count += 1;

  // Check if over limit
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Create rate limit headers for API response.
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
  };
}

// Preset configurations
export const RATE_LIMITS = {
  /** Standard API endpoints: 100 requests per minute */
  standard: { limit: 100, windowMs: 60 * 1000 },

  /** Strict endpoints (auth, sensitive): 20 requests per minute */
  strict: { limit: 20, windowMs: 60 * 1000 },

  /** Generous endpoints (reads): 200 requests per minute */
  generous: { limit: 200, windowMs: 60 * 1000 },
} as const;
