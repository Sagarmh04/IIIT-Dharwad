import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next internals and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Allow requests for static assets (images, fonts, css, js) by checking for
  // a file extension in the pathname — these should not be redirected to login.
  if (pathname.match(/\.[^/]+$/)) {
    return NextResponse.next();
  }

  // Allow login page and assets
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico).*)"],
};
