import { NextResponse } from "next/server";
import { rateLimit, getClientIdentifier, RateLimitConfig } from "./rate-limit";

/**
 * Middleware helper to check rate limit and return error response if exceeded
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns null if rate limit is OK, NextResponse with 429 status if exceeded
 * 
 * @example
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = checkRateLimit(request, RATE_LIMITS.AUTH);
 *   if (rateLimitResult) return rateLimitResult;
 *   
 *   // Continue with request handling...
 * }
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): NextResponse | null {
  const identifier = getClientIdentifier(request);
  const result = rateLimit(identifier, config);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Try again in ${Math.ceil((result.reset - Date.now() / 1000) / 60)} minutes.`,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
          "Retry-After": String(Math.ceil(result.reset - Date.now() / 1000)),
        },
      }
    );
  }

  return null;
}

/**
 * Get rate limit headers to include in successful responses
 */
export function getRateLimitHeaders(
  request: Request,
  config: RateLimitConfig
): Record<string, string> {
  const identifier = getClientIdentifier(request);
  const result = rateLimit(identifier, config);

  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
