/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or Upstash for distributed rate limiting
 */

type RateLimitStore = {
  [key: string]: {
    count: number;
    resetTime: number;
  };
};

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  limit: number;
  /**
   * Time window in seconds
   */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier (e.g., IP address, user ID, API key)
 * @param config - Rate limit configuration
 * @returns Result object with success status and rate limit headers
 * 
 * @example
 * const result = rateLimit(request.ip, { limit: 100, windowSeconds: 60 });
 * if (!result.success) {
 *   return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 * }
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  // Get or create entry
  if (!store[identifier] || store[identifier].resetTime < now) {
    store[identifier] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  const entry = store[identifier];

  // Increment count
  entry.count++;

  const remaining = Math.max(0, config.limit - entry.count);
  const success = entry.count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining,
    reset: Math.ceil(entry.resetTime / 1000),
  };
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  const ip = cfConnectingIp || realIp || forwardedFor?.split(",")[0] || "unknown";

  return ip;
}

/**
 * Preset rate limit configurations
 */
export const RATE_LIMITS = {
  // Strict - for auth endpoints (login, register)
  AUTH: { limit: 5, windowSeconds: 60 }, // 5 requests per minute
  
  // Standard - for general API endpoints
  API: { limit: 100, windowSeconds: 60 }, // 100 requests per minute
  
  // Relaxed - for read-only endpoints
  READ: { limit: 300, windowSeconds: 60 }, // 300 requests per minute
  
  // Very strict - for expensive operations (exports, reports)
  EXPENSIVE: { limit: 10, windowSeconds: 60 }, // 10 requests per minute
} as const;
