"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireRoot, recordAudit, rootCount, getRoleForEmail, type Role } from "@/lib/roles";
import { currentUserId } from "@/lib/auth-guard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendAdminInvite } from "@/lib/email";

export type TeamActionResult = { ok: true } | { ok: false; error: string };

const ROLES = ["root", "admin", "moderator"] as const;
const INVITE_TTL_HOURS = 72;

const inviteSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.enum(ROLES),
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL ?? "").replace(/\/$/, "");

/** Root invites an email at a role. Generates a single-use, expiring token and
 *  emails an accept link. Re-inviting the same email replaces any pending invite. */
export async function inviteAdmin(input: { email: string; role: string }): Promise<TeamActionResult> {
  const actor = await requireRoot();
  if (!actor) return { ok: false, error: "Only a root admin can invite." };

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details." };
  const email = parsed.data.email.toLowerCase();
  const role = parsed.data.role as Role;

  // Already an admin? Nothing to invite.
  if (await getRoleForEmail(email)) return { ok: false, error: "That email already has a role." };

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + INVITE_TTL_HOURS * 3600 * 1000);

  try {
    // One pending invite per email: clear old unaccepted ones first.
    await sql`DELETE FROM admin_invitations WHERE lower(email) = ${email} AND accepted_at IS NULL`;
    await sql`
      INSERT INTO admin_invitations (email, role, token, invited_by, expires_at)
      VALUES (${email}, ${role}, ${token}, ${actor.email}, ${expires.toISOString()})
    `;
  } catch (err) {
    console.error("[team] invite insert failed", err);
    return { ok: false, error: "Could not create the invitation." };
  }

  const acceptUrl = `${SITE_URL}/invite/accept?token=${token}`;
  const sent = await sendAdminInvite({ to: email, role, invitedBy: actor.email, url: acceptUrl });
  if (!sent.ok) {
    // Roll back so a failed email doesn't leave a dangling token.
    try {
      await sql`DELETE FROM admin_invitations WHERE token = ${token}`;
    } catch (err) {
      console.error("[team] invite rollback failed", err);
    }
    return { ok: false, error: `Invitation email failed: ${sent.error}` };
  }

  await recordAudit(actor.email, "team.invite", email, { role });
  revalidatePath("/studio/team");
  return { ok: true };
}

export async function revokeInvite(id: string): Promise<TeamActionResult> {
  const actor = await requireRoot();
  if (!actor) return { ok: false, error: "Only a root admin can do this." };
  try {
    const rows = (await sql`
      DELETE FROM admin_invitations WHERE id = ${id} AND accepted_at IS NULL RETURNING email
    `) as { email: string }[];
    if (!rows[0]) return { ok: false, error: "Invitation not found." };
    await recordAudit(actor.email, "team.invite_revoke", rows[0].email);
  } catch (err) {
    console.error("[team] revoke invite failed", err);
    return { ok: false, error: "Could not revoke the invitation." };
  }
  revalidatePath("/studio/team");
  return { ok: true };
}

/** Change an existing member's role. Guards the last root from demotion. */
export async function changeRole(email: string, role: string): Promise<TeamActionResult> {
  const actor = await requireRoot();
  if (!actor) return { ok: false, error: "Only a root admin can do this." };
  if (!ROLES.includes(role as Role)) return { ok: false, error: "Invalid role." };
  const target = email.toLowerCase();

  const currentRole = await getRoleForEmail(target);
  if (!currentRole) return { ok: false, error: "That email isn't a member." };
  if (currentRole === "root" && role !== "root" && (await rootCount()) <= 1) {
    return { ok: false, error: "Can't demote the last root admin." };
  }

  try {
    await sql`
      INSERT INTO admin_roles (email, role, invited_by)
      VALUES (${target}, ${role}, ${actor.email})
      ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
    `;
    await recordAudit(actor.email, "team.role_change", target, { from: currentRole, to: role });
  } catch (err) {
    console.error("[team] change role failed", err);
    return { ok: false, error: "Could not update the role." };
  }
  revalidatePath("/studio/team");
  return { ok: true };
}

/** Remove a member entirely. Guards the last root; also blocks self-removal so a
 *  root can't accidentally lock themselves out mid-session. */
export async function removeMember(email: string): Promise<TeamActionResult> {
  const actor = await requireRoot();
  if (!actor) return { ok: false, error: "Only a root admin can do this." };
  const target = email.toLowerCase();
  if (target === actor.email.toLowerCase()) return { ok: false, error: "You can't remove yourself." };

  const currentRole = await getRoleForEmail(target);
  if (!currentRole) return { ok: false, error: "That email isn't a member." };
  if (currentRole === "root" && (await rootCount()) <= 1) {
    return { ok: false, error: "Can't remove the last root admin." };
  }

  try {
    await sql`DELETE FROM admin_roles WHERE email = ${target}`;
    await recordAudit(actor.email, "team.remove", target, { was: currentRole });
  } catch (err) {
    console.error("[team] remove member failed", err);
    return { ok: false, error: "Could not remove the member." };
  }
  revalidatePath("/studio/team");
  return { ok: true };
}

/** The invitee accepts. Must be signed in with the invited email (they sign up
 *  or sign in through the normal flow first). Validates token + email match,
 *  then writes the role and marks the invite accepted. Single-use, expiring. */
export async function acceptInvitation(token: string): Promise<TeamActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in with the invited email first." };

  const session = await auth.api.getSession({ headers: await headers() });
  const sessionEmail = session?.user.email?.toLowerCase();
  if (!sessionEmail) return { ok: false, error: "Please sign in first." };

  let invite: { id: string; email: string; role: Role } | null = null;
  try {
    const rows = (await sql`
      SELECT id, email, role FROM admin_invitations
      WHERE token = ${token} AND accepted_at IS NULL AND expires_at > now()
      LIMIT 1
    `) as { id: string; email: string; role: Role }[];
    invite = rows[0] ?? null;
  } catch (err) {
    console.error("[team] accept lookup failed", err);
    return { ok: false, error: "Could not process the invitation." };
  }
  if (!invite) return { ok: false, error: "This invitation is invalid, already used, or expired." };
  if (invite.email.toLowerCase() !== sessionEmail) {
    return { ok: false, error: "This invitation was sent to a different email. Sign in with that address." };
  }

  try {
    await sql`
      INSERT INTO admin_roles (email, role, invited_by)
      VALUES (${sessionEmail}, ${invite.role}, ${"invitation"})
      ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
    `;
    await sql`UPDATE admin_invitations SET accepted_at = now() WHERE id = ${invite.id}`;
    await recordAudit(sessionEmail, "team.invite_accept", sessionEmail, { role: invite.role });
  } catch (err) {
    console.error("[team] accept write failed", err);
    return { ok: false, error: "Could not activate your access." };
  }
  revalidatePath("/studio");
  return { ok: true };
}
