import { NextResponse, type NextRequest } from "next/server";

/**
 * Two jobs, both cheap enough to run on every request.
 *
 * 1. Publishes the request path as a header so the server-side isolation gate
 *    (see @/lib/isolation) can tell which routes to let through — the gate
 *    itself needs a DB + session lookup, which middleware can't do here.
 *
 * 2. Sends `X-Robots-Tag: noindex, nofollow` on every response. robots.txt is
 *    only a request not to crawl; this header is what actually keeps a page
 *    out of an index if it is reached another way — a shared link, a
 *    third-party crawler, a preview URL. Belt and braces while the site is
 *    unlaunched.
 *
 * Deliberately does NOT enforce the gate itself. Doing that here would mean
 * trusting the presence of a session cookie, which proves only that someone
 * once signed in — not that they are a studio user, and not that the cookie is
 * still valid. The real check runs server-side where the session and role can
 * actually be verified.
 */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);

  const res = NextResponse.next({ request: { headers } });
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return res;
}

export const config = {
  // Everything except Next's own assets and the favicon. The auth API is
  // included on purpose: it needs the noindex header too, and the gate lets it
  // through by path.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
