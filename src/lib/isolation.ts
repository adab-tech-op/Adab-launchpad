import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getIsolationMode } from "@/lib/settings-server";
import { currentActor } from "@/lib/roles";

/**
 * Paths that stay reachable while the site is isolated — otherwise the gate
 * would lock out the very page people need in order to pass it.
 *
 * Kept deliberately tight. Anything not listed here is closed, so a route
 * added later is private by default rather than accidentally public.
 */
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
  "/api/auth", // Better Auth endpoints — sign-in cannot complete without them
  "/robots.txt",
  "/favicon",
  "/assets", // the gate page's own logo/background
];

function isOpenPath(pathname: string): boolean {
  return OPEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p));
}

/**
 * Closes the whole site behind sign-in while isolation mode is on.
 *
 * Only studio users (root / admin / moderator) get through: `currentActor()`
 * returns null for a signed-in customer as well as for an anonymous visitor,
 * so a customer account is not a way in. That is the point of the gate — it is
 * a staff-only shutter, not a login wall.
 *
 * Fails CLOSED. `getIsolationMode()` already defaults to on when the settings
 * row or table is unreachable, and any error resolving the actor leaves them
 * outside. The wrong failure here publishes an unlaunched storefront.
 */
export async function enforceIsolation(): Promise<void> {
  if (!(await getIsolationMode())) return;

  const pathname = (await headers()).get("x-pathname") ?? "";
  if (isOpenPath(pathname)) return;

  const actor = await currentActor();
  if (actor) return;

  redirect("/signin?gate=1");
}
