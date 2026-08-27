"use server";

import { after } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getOrderByRef, hasAccountForEmail } from "@/lib/queries";
import { commitOrderStock } from "@/lib/product-stock-server";
import { sendPaymentReceived } from "@/lib/email";

const schema = z.object({
  orderRef: z.string().trim().regex(/^ADAB-[A-Z0-9]{6}$/, "Invalid order reference"),
  bkashNumber: z
    .string()
    .trim()
    .regex(/^01[3-9]\d{8}$/, "Enter a valid bKash number (e.g. 01XXXXXXXXX)"),
  trxId: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9]{6,20}$/, "Enter a valid bKash Transaction ID")),
  // Opt-in marketing consent, captured on the /pay form (default false).
  marketingConsent: z.boolean().optional().default(false),
});

export type PaymentResult = { ok: true } | { ok: false; error: string };

export async function recordPayment(input: {
  orderRef: string;
  bkashNumber: string;
  trxId: string;
  marketingConsent?: boolean;
}): Promise<PaymentResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { orderRef, bkashNumber, trxId, marketingConsent } = parsed.data;

  const order = await getOrderByRef(orderRef);
  if (!order) return { ok: false, error: "We couldn't find that order." };
  if (["paid", "delivered", "cancelled"].includes(order.status)) {
    return { ok: false, error: "This order has already been processed." };
  }

  try {
    await sql`
      INSERT INTO payments (order_ref, bkash_number, trx_id, amount)
      VALUES (${orderRef}, ${bkashNumber}, ${trxId}, ${order.total})
      ON CONFLICT (order_ref) DO UPDATE SET
        bkash_number = EXCLUDED.bkash_number,
        trx_id = EXCLUDED.trx_id,
        amount = EXCLUDED.amount,
        submitted_at = now()
    `;
  } catch (err) {
    const msg = String((err as { message?: string })?.message ?? err);
    if (/unique|duplicate|23505|trx_id/i.test(msg)) {
      return { ok: false, error: "This Transaction ID has already been submitted." };
    }
    console.error("[payments] insert failed", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Legacy mirror — kept so /account views + StatusBadge read a valid status.
  try {
    await sql`
      UPDATE reservations SET status = 'payment_submitted'
      WHERE order_ref = ${orderRef} AND status IN ('pending', 'payment_not_received')
    `;
  } catch (err) {
    console.error("[payments] status update failed", err);
  }

  // Two-axis source of truth: mark payment submitted (unless already advanced).
  // Best-effort + guarded so it works even if the migration hasn't run yet.
  try {
    await sql`
      INSERT INTO order_state (order_ref, payment_status)
      VALUES (${orderRef}, 'submitted')
      ON CONFLICT (order_ref) DO UPDATE SET
        payment_status = CASE
          WHEN order_state.payment_status IN ('pending', 'not_received') THEN 'submitted'
          ELSE order_state.payment_status
        END,
        updated_at = now()
    `;
  } catch (err) {
    console.error("[payments] order_state update skipped/failed", err);
  }

  // Option C: decrement stock now (exactly once — see commitOrderStock).
  await commitOrderStock(orderRef);

  // Record opt-in marketing consent against this order's rows (best-effort).
  if (marketingConsent) {
    try {
      await sql`UPDATE reservations SET marketing_consent = true WHERE order_ref = ${orderRef}`;
    } catch (err) {
      console.error("[payments] marketing_consent update skipped/failed", err);
    }
  }

  after(async () => {
    // Guests (no account yet) get the "set a password" CTA on this email — the
    // account link moved here from the removed reservation email.
    const canCreateAccount = !(await hasAccountForEmail(order.email));
    await sendPaymentReceived({
      to: order.email,
      name: order.name,
      phone: order.phone,
      orderRef,
      items: order.items.map((i) => ({ product_slug: i.slug, size: i.size, quantity: i.quantity })),
      amount: order.total,
      bkashNumber,
      trxId,
      canCreateAccount,
    });
  });

  return { ok: true };
}
