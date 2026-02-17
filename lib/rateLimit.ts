import { Redis } from "@upstash/redis";

const hasRedisEnv = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);
const redis = hasRedisEnv ? Redis.fromEnv() : null;
let warnedMissingRedis = false;

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
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();

  if (!redis) {
    if (!warnedMissingRedis) {
      console.warn(
        "Rate limiting disabled: UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN missing."
      );
      warnedMissingRedis = true;
    }
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      resetTime: now + config.windowMs,
    };
  }

  const windowId = Math.floor(now / config.windowMs);
  const key = `ratelimit:${identifier}:${windowId}`;

  const [countResult, ttlResult] = await redis
    .multi()
    .incr(key)
    .pttl(key)
    .exec();

  const count = Number(countResult ?? 0);
  let ttlMs = Number(ttlResult ?? 0);

  if (count === 1 || ttlMs <= 0) {
    await redis.pexpire(key, config.windowMs);
    ttlMs = config.windowMs;
  }

  return {
    success: count <= config.limit,
    limit: config.limit,
    remaining: Math.max(0, config.limit - count),
    resetTime: now + ttlMs,
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
