"use server";

import { after } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getOrderByRef } from "@/lib/queries";
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
});

export type PaymentResult = { ok: true } | { ok: false; error: string };

export async function recordPayment(input: {
  orderRef: string;
  bkashNumber: string;
  trxId: string;
}): Promise<PaymentResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { orderRef, bkashNumber, trxId } = parsed.data;

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

  try {
    await sql`
      UPDATE reservations SET status = 'payment_submitted'
      WHERE order_ref = ${orderRef} AND status IN ('pending', 'payment_not_received')
    `;
  } catch (err) {
    console.error("[payments] status update failed", err);
  }

  after(() =>
    sendPaymentReceived({
      to: order.email,
      name: order.name,
      phone: order.phone,
      orderRef,
      items: order.items.map((i) => ({ product_slug: i.slug, size: i.size, quantity: i.quantity })),
      amount: order.total,
      bkashNumber,
      trxId,
    }),
  );

  return { ok: true };
}
