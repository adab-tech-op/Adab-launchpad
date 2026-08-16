import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { adminEmails } from "@/lib/admin";

export type Role = "root" | "admin" | "moderator";

const RANK: Record<Role, number> = { moderator: 1, admin: 2, root: 3 };

/** The env-configured bootstrap root, lowercased. Falls back to the first
 *  ADMIN_EMAILS entry so a fresh install always has exactly one reachable root. */
export function bootstrapRootEmail(): string | null {
  const explicit = process.env.ROOT_ADMIN_EMAIL?.trim().toLowerCase();
  if (explicit) return explicit;
  return adminEmails()[0] ?? null;
}

/** Resolve a role for an email: the admin_roles table wins; if there's no row,
 *  fall back to env (ROOT_ADMIN_EMAIL -> root, ADMIN_EMAILS -> admin). Returns
 *  null for a non-admin. Never throws — a DB error degrades to env-only. */
export async function getRoleForEmail(email: string): Promise<Role | null> {
  const lower = email.toLowerCase();
  try {
    const rows = (await sql`SELECT role FROM admin_roles WHERE email = ${lower} LIMIT 1`) as { role: Role }[];
    if (rows[0]) return rows[0].role;
  } catch {
    // admin_roles missing (pre-migration) — fall through to env.
  }
  if (bootstrapRootEmail() === lower) return "root";
  if (adminEmails().includes(lower)) return "admin";
  return null;
}

export type Actor = { email: string; role: Role };

/** The acting user's email + role, or null if not signed in / not an admin. */
export async function currentActor(): Promise<Actor | null> {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    // Next's control-flow signals (redirect / notFound / dynamic-usage) carry a
    // `digest` and MUST propagate — only a genuine auth/DB error is soft-handled.
    if (err && typeof err === "object" && "digest" in err) throw err;
    return null;
  }
  if (!session) return null;
  const role = await getRoleForEmail(session.user.email);
  if (!role) return null;
  return { email: session.user.email, role };
}

export function atLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

/** True if this email holds any studio role. Used to keep staff accounts out of
 *  the customer surface (no reserving, cart, wishlist, or waitlist). */
export async function emailHasRole(email: string): Promise<boolean> {
  return (await getRoleForEmail(email)) !== null;
}

/** True if the CURRENT signed-in user holds any studio role. Guests → false.
 *  Customer actions call this to refuse staff accounts. Never throws on a plain
 *  auth/DB error (fails open to "not staff" so real customers are never blocked);
 *  Next control-flow signals still propagate. */
export async function currentUserIsStaff(): Promise<boolean> {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    return false;
  }
  if (!session) return false;
  return emailHasRole(session.user.email);
}

/** Moderators get a redacted view (no customer contact PII, no TrxIDs). Flip the
 *  threshold here to change what a moderator can see across the studio. */
export function canSeePII(role: Role): boolean {
  return atLeast(role, "admin");
}

// --- Page guards (redirecting) ----------------------------------------------
/** Any studio role may view. Redirects non-admins away. Returns the actor. */
export async function requireStudioAccess(): Promise<Actor> {
  // Distinguish "not signed in" (-> sign in, with a return link) from "signed in
  // but not an admin" (-> home). currentActor() collapses both to null, which
  // made a logged-out visit to /studio bounce silently to the homepage.
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
  }
  if (!session) redirect("/signin?next=/studio");
  const role = await getRoleForEmail(session.user.email);
  if (!role) redirect("/");
  return { email: session.user.email, role };
}

/** Root-only pages (team, activity). Redirects everyone else to /studio. */
export async function requireRootPage(): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) redirect("/");
  if (actor.role !== "root") redirect("/studio");
  return actor;
}

// --- Action guards (non-redirecting) ----------------------------------------
/** For mutating actions: root or admin only. Moderators are refused. */
export async function requireMutator(): Promise<Actor | null> {
  const actor = await currentActor();
  if (!actor || !atLeast(actor.role, "admin")) return null;
  return actor;
}

/** For people/role management: root only. */
export async function requireRoot(): Promise<Actor | null> {
  const actor = await currentActor();
  if (!actor || actor.role !== "root") return null;
  return actor;
}

// --- Audit ------------------------------------------------------------------
/** Append one audit row. Best-effort: never throws, never blocks the action. */
export async function recordAudit(
  actorEmail: string,
  action: string,
  target: string | null,
  detail?: Record<string, unknown>,
): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_log (actor_email, action, target, detail)
      VALUES (${actorEmail}, ${action}, ${target}, ${detail ? JSON.stringify(detail) : null}::jsonb)
    `;
  } catch (err) {
    console.error("[audit] write failed", action, target, err);
  }
}

// --- Roster + presence (root views) -----------------------------------------
export type RosterMember = {
  email: string;
  role: Role;
  fromEnv: boolean; // true when the role comes from env fallback, not a table row
  lastSeen: string | null;
  online: boolean;
};

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/** The full admin roster: table rows unioned with env-derived admins, each
 *  annotated with last-seen + online (derived from active sessions). */
export async function getRoster(): Promise<RosterMember[]> {
  const byEmail = new Map<string, { role: Role; fromEnv: boolean }>();

  // Env-derived first (so table rows overwrite them below).
  const root = bootstrapRootEmail();
  if (root) byEmail.set(root, { role: "root", fromEnv: true });
  for (const e of adminEmails()) if (!byEmail.has(e)) byEmail.set(e, { role: "admin", fromEnv: true });

  try {
    const rows = (await sql`SELECT email, role FROM admin_roles`) as { email: string; role: Role }[];
    for (const r of rows) byEmail.set(r.email.toLowerCase(), { role: r.role, fromEnv: false });
  } catch {
    // table missing — env-only roster.
  }

  // Presence from active sessions.
  const lastSeen = new Map<string, string>();
  try {
    const rows = (await sql`
      SELECT lower(u."email") AS email, MAX(s."updatedAt") AS last_seen
      FROM "session" s JOIN "user" u ON u."id" = s."userId"
      WHERE s."expiresAt" > now()
      GROUP BY lower(u."email")
    `) as { email: string; last_seen: string }[];
    for (const r of rows) lastSeen.set(r.email, r.last_seen);
  } catch (err) {
    console.error("[roster] presence query failed", err);
  }

  const now = Date.now();
  return [...byEmail.entries()]
    .map(([email, { role, fromEnv }]) => {
      const seen = lastSeen.get(email) ?? null;
      return { email, role, fromEnv, lastSeen: seen, online: seen ? now - new Date(seen).getTime() < ONLINE_WINDOW_MS : false };
    })
    .sort((a, b) => RANK[b.role] - RANK[a.role] || a.email.localeCompare(b.email));
}

export type AuditEntry = { actorEmail: string; action: string; target: string | null; detail: Record<string, unknown> | null; createdAt: string };

export async function getAuditLog(limit = 200): Promise<AuditEntry[]> {
  try {
    const rows = (await sql`
      SELECT actor_email, action, target, detail, created_at
      FROM audit_log ORDER BY created_at DESC LIMIT ${limit}
    `) as { actor_email: string; action: string; target: string | null; detail: Record<string, unknown> | null; created_at: string }[];
    return rows.map((r) => ({ actorEmail: r.actor_email, action: r.action, target: r.target, detail: r.detail, createdAt: r.created_at }));
  } catch (err) {
    console.error("[audit] read failed", err);
    return [];
  }
}

export type PendingInvite = { id: string; email: string; role: Role; invitedBy: string; createdAt: string; expiresAt: string };

export async function getPendingInvites(): Promise<PendingInvite[]> {
  try {
    const rows = (await sql`
      SELECT id, email, role, invited_by, created_at, expires_at
      FROM admin_invitations
      WHERE accepted_at IS NULL AND expires_at > now()
      ORDER BY created_at DESC
    `) as { id: string; email: string; role: Role; invited_by: string; created_at: string; expires_at: string }[];
    return rows.map((r) => ({ id: r.id, email: r.email, role: r.role, invitedBy: r.invited_by, createdAt: r.created_at, expiresAt: r.expires_at }));
  } catch (err) {
    console.error("[invites] read failed", err);
    return [];
  }
}

/** Guard against removing/demoting the last root — both DB rows and, if the DB
 *  has no roots yet, the env bootstrap root count as roots. */
export async function rootCount(): Promise<number> {
  const roster = await getRoster();
  return roster.filter((m) => m.role === "root").length;
}
