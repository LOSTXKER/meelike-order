import { NextResponse } from "next/server";
import { rateLimiter, getClientIdentifier, RATE_LIMITS } from "./rate-limit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type RateLimitConfig = {
  limit: number;
  window: number;
};

/**
 * Rate limit middleware for API routes
 * Usage in API route:
 * 
 * export async function POST(req: Request) {
 *   const rateLimitResponse = await checkRateLimit(req, RATE_LIMITS.API);
 *   if (rateLimitResponse) return rateLimitResponse;
 *   
 *   // Your API logic here
 * }
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
  useUserId = true
): Promise<NextResponse | null> {
  try {
    let identifier: string;

    if (useUserId) {
      // Try to get user ID from session
      const session = await getServerSession(authOptions);
      identifier = session?.user?.id || getClientIdentifier(request);
    } else {
      // Use IP address
      identifier = getClientIdentifier(request);
    }

    const result = rateLimiter.check(identifier, config.limit, config.window);

    // Set rate limit headers
    const headers = {
      "X-RateLimit-Limit": config.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
    };

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    // Rate limit OK - return null (no error)
    return null;
  } catch (error) {
    console.error("Rate limit check error:", error);
    // On error, allow the request (fail open)
    return null;
  }
}

/**
 * Helper to add rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  identifier: string,
  config: RateLimitConfig
): NextResponse {
  const result = rateLimiter.check(identifier, config.limit, config.window);
  
  response.headers.set("X-RateLimit-Limit", config.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", new Date(result.resetAt).toISOString());
  
  return response;
}



