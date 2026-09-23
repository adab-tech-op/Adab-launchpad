import { NextResponse, type NextRequest } from "next/server";
import { getIsolationMode } from "@/lib/settings-server";
import { actorForHeaders } from "@/lib/roles";

/**
 * The isolation gate.
 *
 * This MUST live in middleware, not in the root layout. Next does not re-run a
 * layout on client-side navigation, so a layout-based gate is skipped entirely
 * the moment someone clicks a <Link> — which is exactly how the navbar logo
 * became a bypass: the sign-in page renders the header, and clicking the logo
 * soft-navigated straight into the site without the gate ever running.
 *
 * Middleware runs on every request, including the RSC payload fetches that
 * client-side navigation makes, so there is no route into the app that skips
 * it. It also covers route handlers (sitemap, API), which never pass through
 * the root layout at all.
 *
 * Runs on the Node runtime because the check needs a real session lookup and a
 * database read. Trusting the mere presence of a session cookie would let any
 * signed-in customer — or a removed admin whose cookie is still valid — walk
 * straight through.
 */
export const config = {
  runtime: "nodejs",
  // Everything except Next's build assets. Auth endpoints are included so they
  // get the noindex header; the allowlist below lets them function.
  matcher: ["/((?!_next/static|_next/image).*)"],
};

/** Paths that must stay reachable, or nobody could sign in to pass the gate. */
const OPEN_PREFIXES = [
  "/signin",
  "/signup",
  // An invitee is not staff yet — that is the whole point of the invitation —
  // so the gate would bounce them to sign-in with no way back to the token.
  // The link is safe to leave open: /invite/accept does nothing without a
  // valid, unexpired token, and accepting still requires a signed-in session
  // whose email matches the invited address.
  "/invite",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/robots.txt",
  "/favicon",
  "/assets",
];

function isOpenPath(pathname: string): boolean {
  return OPEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  const pass = () => {
    const res = NextResponse.next({ request: { headers } });
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return res;
  };

  if (isOpenPath(pathname)) return pass();

  let isolated = true; // fail closed if the setting can't be read
  try {
    isolated = await getIsolationMode();
  } catch {
    // keep the default
  }
  if (!isolated) return pass();

  let actor = null;
  try {
    actor = await actorForHeaders(req.headers);
  } catch {
    actor = null; // any failure resolving the actor leaves them outside
  }
  if (actor) return pass();

  const url = req.nextUrl.clone();
  url.pathname = "/signin";
  url.search = "?gate=1";
  const res = NextResponse.redirect(url);
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return res;
}
