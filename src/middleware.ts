import { NextResponse, type NextRequest } from "next/server";
import { getIsolationMode } from "@/lib/settings-server";
import { actorForHeaders } from "@/lib/roles";
import { sql } from "@/lib/db";
import { hasPendingInvite } from "@/lib/invitations-server";

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

/**
 * /signup is NOT open while the site is closed.
 *
 * Leaving it open let any stranger register, which did not get them in — the
 * gate needs a role, and a self-registered account has none — but it did let
 * them fill the user table and fire a verification email from our domain, on
 * our sending quota, for an account that can never do anything. Offering
 * "create an account" on a lock also reads as a way in, so people try, fail,
 * and conclude the site is broken.
 *
 * So sign-up is reachable only while carrying a real invitation: the token
 * must exist in admin_invitations, be unexpired and unaccepted. A fabricated
 * token does not open it.
 */
async function signupCarriesValidInvite(url: URL): Promise<boolean> {
  const next = url.searchParams.get("next");
  if (!next) return false;

  let token: string | null = null;
  try {
    // next is a relative path like /invite/accept?token=...
    token = new URL(next, url.origin).searchParams.get("token");
  } catch {
    return false;
  }
  if (!token) return false;

  try {
    const rows = (await sql`
      SELECT 1 FROM admin_invitations
      WHERE token = ${token} AND accepted_at IS NULL AND expires_at > now()
      LIMIT 1
    `) as unknown[];
    return rows.length > 0;
  } catch {
    // Can't verify the invitation — keep sign-up closed rather than guess.
    return false;
  }
}

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

  // The sign-up API is checked before the blanket /api/auth allowance:
  // blocking the /signup PAGE is cosmetic while the endpoint behind it stays
  // open, since anyone holding an invite link could POST whichever address
  // they liked and register it.
  const isSignUpApi = req.method === "POST" && pathname.startsWith("/api/auth/sign-up");

  // Cheap path first: assets, auth endpoints and robots never need a database
  // read. /signin is excluded because while closed it needs the gate flag.
  if (isOpenPath(pathname) && pathname !== "/signin" && !isSignUpApi) return pass();

  let isolated = true; // fail closed if the setting can't be read
  try {
    isolated = await getIsolationMode();
  } catch {
    // keep the default
  }
  if (!isolated) return pass();

  // A direct visit to /signin while closed should look the same as being sent
  // there by the gate: invitation-only copy, no "create an account" link that
  // only bounces. Marking the URL is enough — the page reads the flag.
  if (pathname === "/signin" && !req.nextUrl.searchParams.has("gate")) {
    const url = req.nextUrl.clone();
    url.searchParams.set("gate", "1");
    return NextResponse.redirect(url);
  }
  // Already flagged — let it render. Without this it would fall through to the
  // actor check below and redirect to itself forever.
  if (pathname === "/signin") return pass();

  // Sign-up API: only for an address that already has an invitation waiting.
  // The read-only field on the form is a courtesy; THIS is the enforcement.
  if (isSignUpApi) {
    let email: string | null = null;
    try {
      // Clone so the original body stream stays intact for the route itself.
      const body = (await req.clone().json()) as { email?: string };
      email = typeof body.email === "string" ? body.email : null;
    } catch {
      email = null;
    }
    if (await hasPendingInvite(email)) return pass();
    return NextResponse.json(
      { error: "Sign-up is by invitation only while ADAB is in private beta." },
      { status: 403 },
    );
  }

  // Sign-up: invitation-only while closed.
  if (pathname === "/signup" || pathname.startsWith("/signup/")) {
    if (await signupCarriesValidInvite(req.nextUrl)) return pass();
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.search = "?gate=1";
    return NextResponse.redirect(url);
  }

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
