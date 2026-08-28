"use server";

import { z } from "zod";
import { sql } from "@/lib/db";
import { generateOrderRef } from "@/lib/order-ref";
import { currentUserIsStaff } from "@/lib/roles";
import { getAllowMultiOrder } from "@/lib/settings-server";
import { validateCoupon, freezeOrderPricing } from "@/lib/coupons-server";

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

const itemSchema = z.object({
  product_slug: z.string().trim().min(1).max(120),
  size: z.enum(SIZES),
  quantity: z.number().int().min(1).max(10),
});

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(3).max(40),
  delivery_address: z.string().trim().max(1000).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1).max(20),
});

export type ReservationResult =
  | { ok: true; orderRef: string }
  | { ok: false; error: string };

/**
 * Create a reservation ("order"). All line items are written under one shared
 * order_ref inside a single transaction, so an order is the set of reservation
 * rows carrying that ref.
 */
export async function createReservation(input: {
  name: string;
  email: string;
  phone: string;
  delivery_address?: string;
  notes?: string;
  items: { product_slug: string; size: string; quantity: number }[];
  couponCode?: string;
}): Promise<ReservationResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  // Studio accounts (root/admin/moderator) can't place orders — they have no
  // customer footprint. A staff member who wants to buy uses a personal account.
  if (await currentUserIsStaff()) {
    return { ok: false, error: "Admin accounts can't place orders. Please use a personal account to shop." };
  }

  const { name, email, phone, delivery_address, notes, items } = parsed.data;
  const orderRef = generateOrderRef();

  // Offer gate: one product/one size per order by default; the offer toggle
  // (Studio → Settings) relaxes it for occasional promotions.
  if (items.length > 1 && !(await getAllowMultiOrder())) {
    return { ok: false, error: "Just one piece per order right now — please place separate orders." };
  }

  // Availability gate: a size tracked at 0 stock, or a product marked sold out,
  // is not reservable. Untracked sizes (no stock row yet) count as available, so
  // products without stock set up keep working. Tolerant if tables are missing.
  try {
    for (const it of items) {
      const rows = (await sql`
        SELECT ps.stock AS stock, p.sold_out AS sold_out
        FROM products p
        LEFT JOIN product_sizes ps ON ps.product_slug = p.slug AND ps.size = ${it.size}
        WHERE p.slug = ${it.product_slug} LIMIT 1
      `) as { stock: number | null; sold_out: boolean | null }[];
      const r = rows[0];
      if (r?.sold_out) return { ok: false, error: "That piece has just sold out." };
      if (r && r.stock !== null && r.stock <= 0) return { ok: false, error: `Size ${it.size} has just sold out.` };
    }
  } catch (err) {
    console.error("[reservation] stock gate skipped (tables missing?)", err);
  }

  // If this email already belongs to an account, the order is owned from the
  // start (real user_id). Otherwise it's a guest order (user_id NULL) that a
  // later signup will claim via the auth user.create hook. Email is the anchor
  // either way — no account is ever required to reserve or pay.
  let existingUserId: string | null = null;
  try {
    const found = (await sql`
      SELECT "id" FROM "user" WHERE lower("email") = lower(${email}) LIMIT 1
    `) as { id: string }[];
    existingUserId = found[0]?.id ?? null;
  } catch (err) {
    // Non-fatal: fall back to a guest order rather than blocking checkout.
    console.error("[reservation] user lookup failed", err);
  }

  try {
    await sql.transaction(
      items.map(
        (it) => sql`
          INSERT INTO reservations
            (order_ref, name, email, phone, product_slug, size, quantity, delivery_address, notes, user_id)
          VALUES
            (${orderRef}, ${name}, ${email}, ${phone}, ${it.product_slug}, ${it.size},
             ${it.quantity}, ${delivery_address || null}, ${notes || null}, ${existingUserId})
        `,
      ),
    );
  } catch (err) {
    console.error("[reservation] insert failed", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // SILENT RESERVE — intentionally no email here. In a limited-stock drop, two
  // customers can reserve the same last piece; a "we've held your piece" email
  // is an unkeepable written promise. The customer's first (and only automatic)
  // email is sent at payment submission instead — see recordPayment. The order
  // reference is shown on-screen and carried into /pay, which is how they pay.

  // Freeze the price (and, if a valid code was applied, its redemption) onto the
  // order — the amount the customer is quoted must never drift. Re-validate the
  // coupon server-side; an invalid code just means no coupon (L1 sale still
  // applies). Best-effort: never blocks the confirmed order.
  let validCoupon = null;
  if (input.couponCode && input.couponCode.trim()) {
    const v = await validateCoupon(input.couponCode, items, email);
    if (v.ok) validCoupon = v.coupon;
  }
  await freezeOrderPricing(orderRef, items, email, validCoupon);

  return { ok: true, orderRef };
}
