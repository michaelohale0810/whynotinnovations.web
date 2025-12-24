import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "wn_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path starts with /app
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    const session = request.cookies.get(COOKIE_NAME);

    if (!session?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app", "/app/:path*"],
};

