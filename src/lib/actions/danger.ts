"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireRoot, recordAudit, bootstrapRootEmail } from "@/lib/roles";
import { adminEmails } from "@/lib/admin";

export type DangerResult = { ok: true; message: string } | { ok: false; error: string };

// A destructive action only runs if the admin types this exact phrase — a
// deliberate friction so nothing here fires on a stray click.
const CONFIRM_PHRASE = "DELETE";

function confirmed(phrase: string): boolean {
  return phrase.trim() === CONFIRM_PHRASE;
}

/** The set of emails that must survive an account wipe: every admin_roles row
 *  plus the env-derived admins/root. Lowercased. */
async function keepEmails(): Promise<string[]> {
  const keep = new Set<string>();
  const root = bootstrapRootEmail();
  if (root) keep.add(root);
  for (const e of adminEmails()) keep.add(e);
  try {
    const rows = (await sql`SELECT email FROM admin_roles`) as { email: string }[];
    for (const r of rows) keep.add(r.email.toLowerCase());
  } catch {
    // admin_roles missing — env keep-list still applies.
  }
  return [...keep];
}

/** Wipe all order data — reservations, payments, two-axis state, follow-ups.
 *  Irreversible. Root-only. Intended for clearing test entries before launch. */
export async function purgeOrders(confirm: string): Promise<DangerResult> {
  const actor = await requireRoot();
  if (!actor) return { ok: false, error: "Only a root admin can do this." };
  if (!confirmed(confirm)) return { ok: false, error: `Type ${CONFIRM_PHRASE} to confirm.` };

  try {
    const counts = (await sql`SELECT count(DISTINCT order_ref)::int AS n FROM reservations`) as { n: number }[];
    const orderCount = counts[0]?.n ?? 0;
    await sql`TRUNCATE follow_ups, order_state, payments, reservations RESTART IDENTITY`;
    await recordAudit(actor.email, "data.purge_orders", null, { orders: orderCount });
    revalidatePath("/studio/orders");
    revalidatePath("/studio");
    return { ok: true, message: `Cleared ${orderCount} order${orderCount === 1 ? "" : "s"} and all related payment records.` };
  } catch (err) {
    console.error("[danger] purgeOrders failed", err);
    return { ok: false, error: "Purge failed. Please try again." };
  }
}

/** Clear the inbox (contact messages) and/or the marketing signups. */
export async function purgeMessagesAndSignups(confirm: string): Promise<DangerResult> {
  const actor = await requireRoot();
  if (!actor) return { ok: false, error: "Only a root admin can do this." };
  if (!confirmed(confirm)) return { ok: false, error: `Type ${CONFIRM_PHRASE} to confirm.` };

  try {
    await sql`TRUNCATE contact_messages, waitlist_signups, marketing_unsubscribes RESTART IDENTITY`;
    await recordAudit(actor.email, "data.purge_messages_signups", null);
    revalidatePath("/studio/inbox");
    revalidatePath("/studio/notify");
    return { ok: true, message: "Cleared contact messages and marketing signups." };
  } catch (err) {
    console.error("[danger] purgeMessagesAndSignups failed", err);
    return { ok: false, error: "Purge failed. Please try again." };
  }
}

/** Delete every CUSTOMER account (and its cascaded sessions/profile/wishlist),
 *  keeping only studio members. Their orders are orphaned back to guest orders
 *  (user_id → NULL), not deleted — purge those separately if you want them gone.
 *  Irreversible. Root-only. */
export async function deleteCustomerAccounts(confirm: string): Promise<DangerResult> {
  const actor = await requireRoot();
  if (!actor) return { ok: false, error: "Only a root admin can do this." };
  if (!confirmed(confirm)) return { ok: false, error: `Type ${CONFIRM_PHRASE} to confirm.` };

  const keep = await keepEmails();
  if (keep.length === 0) {
    // Safety: never run a wipe with an empty keep-list (would delete everyone).
    return { ok: false, error: "No admin accounts found to preserve — aborting." };
  }

  try {
    // Orphan orders owned by soon-to-be-deleted customers back to guest orders.
    await sql`
      UPDATE reservations SET user_id = NULL
      WHERE user_id IN (SELECT "id" FROM "user" WHERE lower("email") <> ALL(${keep}))
    `;
    // Delete the customers; session/account/profile/wishlist cascade automatically.
    const deleted = (await sql`
      DELETE FROM "user" WHERE lower("email") <> ALL(${keep}) RETURNING "id"
    `) as { id: string }[];
    await recordAudit(actor.email, "data.delete_customers", null, { deleted: deleted.length, kept: keep.length });
    revalidatePath("/studio");
    return { ok: true, message: `Deleted ${deleted.length} customer account${deleted.length === 1 ? "" : "s"}. Kept ${keep.length} studio member${keep.length === 1 ? "" : "s"}.` };
  } catch (err) {
    console.error("[danger] deleteCustomerAccounts failed", err);
    return { ok: false, error: "Deletion failed. Please try again." };
  }
}
