import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated for protected routes
        const isAuthPage = req.nextUrl.pathname.startsWith("/login");
        const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
        const isPublicApi = req.nextUrl.pathname.startsWith("/api/cron");

        // Allow public routes
        if (isAuthPage || isApiAuth || isPublicApi) {
          return true;
        }

        // Require token for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protect all routes except public ones
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

