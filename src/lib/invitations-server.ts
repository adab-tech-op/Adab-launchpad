import "server-only";
import { sql } from "@/lib/db";

/**
 * The address an invitation was issued to, if the token is still usable.
 *
 * Used to bind sign-up to the invited address: the token alone must not let
 * someone register whichever email they like. acceptInvitation() already
 * refuses a mismatch, so this is not the only thing standing between a
 * forwarded link and an admin role — but without it a person can create and
 * verify an account before being told the invitation was never theirs, and
 * every one of those attempts costs a real email and leaves a dead account
 * behind.
 */
export async function invitedEmailForToken(token: string | null | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const rows = (await sql`
      SELECT email FROM admin_invitations
      WHERE token = ${token} AND accepted_at IS NULL AND expires_at > now()
      LIMIT 1
    `) as { email: string }[];
    return rows[0]?.email?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

/** Whether this address has an invitation waiting. Used to keep the sign-up
 *  API closed to everyone else while the site is isolated. */
export async function hasPendingInvite(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  try {
    const rows = (await sql`
      SELECT 1 FROM admin_invitations
      WHERE lower(email) = ${email.toLowerCase()} AND accepted_at IS NULL AND expires_at > now()
      LIMIT 1
    `) as unknown[];
    return rows.length > 0;
  } catch {
    return false;
  }
}

/** Pulls the invite token out of a `next` path like /invite/accept?token=... */
export function tokenFromNext(next: string | null | undefined): string | null {
  if (!next) return null;
  try {
    return new URL(next, "https://placeholder.invalid").searchParams.get("token");
  } catch {
    return null;
  }
}
