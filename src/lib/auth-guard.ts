import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Returns the signed-in user or redirects to /signin. Use in /account pages. */
export async function requireUser() {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    // Next's control-flow signals (redirect / notFound / dynamic-usage) carry a
    // `digest` and MUST propagate. Only a genuine auth/DB error is soft-handled.
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("[auth] getSession failed in requireUser", err);
  }
  if (!session) redirect("/signin");
  return session.user;
}

/** Returns the user id or null (no redirect). Use in actions. */
export async function currentUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}
