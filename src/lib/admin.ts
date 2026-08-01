import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";

// Admins are an env allowlist (comma-separated emails), so no schema/role column
// is needed. Set ADMIN_EMAILS in Vercel, e.g. "you@example.com,ops@example.com".
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.toLowerCase());
}

/** Require a signed-in admin, else send them away. Use in /studio. */
export async function requireAdmin() {
  const user = await requireUser(); // redirects to /signin if not logged in
  if (!isAdminEmail(user.email)) redirect("/");
  return user;
}
