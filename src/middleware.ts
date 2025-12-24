import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - no auth needed
  const publicRoutes = ["/login", "/api/auth", "/api/cron"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Only run middleware on specific routes (exclude static files, api, etc)
export const config = {
  matcher: [
    /*
     * Match dashboard routes only:
     * - /dashboard
     * - /cases
     * - /providers
     * - /team
     * - /reports
     * - /settings
     */
    "/dashboard/:path*",
    "/cases/:path*",
    "/providers/:path*",
    "/team/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
