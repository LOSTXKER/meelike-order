/**
 * Simple in-memory rate limiter
 * For production, consider using Redis (Upstash) or database-backed solution
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (entry.resetAt < now) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Check if request is allowed
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param limit - Max requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns { allowed: boolean, remaining: number, resetAt: number }
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.storage.get(identifier);

    // No entry or expired - create new
    if (!entry || entry.resetAt < now) {
      this.storage.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });

      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
      };
    }

    // Entry exists and not expired
    if (entry.count < limit) {
      entry.count++;
      return {
        allowed: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt,
      };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string) {
    this.storage.delete(identifier);
  }
}

// Global instance
const rateLimiter = new RateLimiter();

export { rateLimiter };

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  AUTH: {
    limit: 5, // 5 attempts
    window: 15 * 60 * 1000, // 15 minutes
  },
  // API endpoints (per user)
  API: {
    limit: 100, // 100 requests
    window: 60 * 1000, // 1 minute
  },
  // Webhook endpoints
  WEBHOOK: {
    limit: 50, // 50 requests
    window: 60 * 1000, // 1 minute
  },
  // File upload
  UPLOAD: {
    limit: 10, // 10 uploads
    window: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (works with proxies)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  return (
    forwardedFor?.split(",")[0] ||
    realIp ||
    "unknown"
  );
}


