import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";

// Admin identity has two layers now:
//  - The ADMIN_EMAILS env allowlist below is the BOOTSTRAP source (used as a
//    fallback by role resolution in @/lib/roles when an email has no admin_roles
//    row). It keeps existing admins working and guarantees a reachable root.
//  - @/lib/roles is the real RBAC layer (root / admin / moderator), table-first.
// Prefer the role guards in @/lib/roles for new code; the helpers here remain
// for the bootstrap allowlist and back-compat.

/** Admins seeded in code as well as in admin_roles, so the isolation gate can
 *  never lock them out — env misconfiguration or an unrun migration would
 *  otherwise leave nobody able to reach the site at all. The table remains the
 *  real source of truth; this is a floor, not a ceiling. */
const SEEDED_ADMIN_EMAILS = [
  "islam83.safiqul@gmail.com",
  "dasgupta.bitop@gmail.com",
];

export function adminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...fromEnv, ...SEEDED_ADMIN_EMAILS]));
}

/** Back-compat: true if the email is an env-allowlisted admin OR the bootstrap
 *  root. Role-aware checks (moderator vs admin vs root) live in @/lib/roles. */
export function isAdminEmail(email: string): boolean {
  const lower = email.toLowerCase();
  const root = process.env.ROOT_ADMIN_EMAIL?.trim().toLowerCase();
  return lower === root || adminEmails().includes(lower);
}

/** Require any signed-in studio user (root / admin / moderator). Used by the
 *  /studio layout so moderators can view. Mutating actions gate more tightly via
 *  requireMutator; root-only pages via requireRootPage (both in @/lib/roles). */
export async function requireAdmin() {
  const user = await requireUser(); // redirects to /signin if not logged in
  const { getRoleForEmail } = await import("@/lib/roles");
  const role = await getRoleForEmail(user.email);
  if (!role) redirect("/");
  return user;
}
