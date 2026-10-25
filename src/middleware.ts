import { NextResponse, type NextRequest } from "next/server";

// Fast redirect for signed-out visitors. The API still enforces auth on every call;
// this only avoids rendering private pages that would immediately 401.
export function middleware(req: NextRequest) {
  if (!req.cookies.has("tp_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/orders/:path*"] };
