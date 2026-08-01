"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

const STATUSES = ["pending", "confirmed", "paid", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

export type AdminActionResult = { ok: true } | { ok: false; error: string };

export async function updateOrderStatus(orderRef: string, status: string): Promise<AdminActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdminEmail(session.user.email)) {
    return { ok: false, error: "Not authorized." };
  }
  if (!STATUSES.includes(status as Status)) {
    return { ok: false, error: "Invalid status." };
  }
  if (!orderRef || orderRef === "—") {
    return { ok: false, error: "Invalid order reference." };
  }
  try {
    await sql`UPDATE reservations SET status = ${status} WHERE order_ref = ${orderRef}`;
    revalidatePath("/studio/orders");
    revalidatePath("/studio");
    return { ok: true };
  } catch (err) {
    console.error("[admin] status update failed", err);
    return { ok: false, error: "Update failed. Please try again." };
  }
}
