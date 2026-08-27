"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getOrderByRef } from "@/lib/queries";
import { releaseOrderStock } from "@/lib/product-stock-server";
import { requireMutator, recordAudit } from "@/lib/roles";
import {
  axesFromLegacy,
  legacyFromAxes,
  deliveryEditable,
  PAYMENT_STEPS,
  DELIVERY_STEPS,
  type OrderAxes,
  type PaymentStatus,
  type DeliveryStatus,
} from "@/lib/order-status";
import {
  sendPaymentConfirmed,
  sendFollowUp,
  type FollowUpTemplate,
} from "@/lib/email";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

/** Resolve the acting admin's email, or null if not authorized to mutate.
 *  Root and admin may mutate; moderators (view-only) are refused here. */
async function actingAdmin(): Promise<string | null> {
  const actor = await requireMutator();
  return actor?.email ?? null;
}

/** Load the current two-axis state for an order, falling back to the derived
 *  view from the legacy status when there's no order_state row yet. */
async function loadAxes(orderRef: string, legacyStatus: string): Promise<OrderAxes> {
  try {
    const rows = (await sql`
      SELECT payment_status, delivery_status, cancelled
      FROM order_state WHERE order_ref = ${orderRef}
    `) as { payment_status: PaymentStatus; delivery_status: DeliveryStatus; cancelled: boolean }[];
    if (rows[0]) {
      return { payment: rows[0].payment_status, delivery: rows[0].delivery_status, cancelled: rows[0].cancelled };
    }
  } catch {
    // order_state missing (pre-migration) — fall through to legacy derivation.
  }
  return axesFromLegacy(legacyStatus);
}

/** Persist a full axes set: upsert order_state AND write the legacy mirror so
 *  customer-facing views stay correct. */
async function persistAxes(orderRef: string, next: OrderAxes): Promise<void> {
  await sql`
    INSERT INTO order_state (order_ref, payment_status, delivery_status, cancelled, updated_at)
    VALUES (${orderRef}, ${next.payment}, ${next.delivery}, ${next.cancelled}, now())
    ON CONFLICT (order_ref) DO UPDATE SET
      payment_status = EXCLUDED.payment_status,
      delivery_status = EXCLUDED.delivery_status,
      cancelled = EXCLUDED.cancelled,
      updated_at = now()
  `;
  await sql`UPDATE reservations SET status = ${legacyFromAxes(next)} WHERE order_ref = ${orderRef}`;
}

function revalidateStudioAndAccount(orderRef: string) {
  revalidatePath("/studio/orders");
  revalidatePath("/studio");
  revalidatePath(`/account/orders/${orderRef}`);
  revalidatePath("/account/orders");
}

// --- Payment axis -----------------------------------------------------------
export async function setPaymentStatus(orderRef: string, payment: string): Promise<AdminActionResult> {
  const admin = await actingAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!orderRef || orderRef === "—") return { ok: false, error: "Invalid order reference." };
  if (!PAYMENT_STEPS.includes(payment as PaymentStatus)) return { ok: false, error: "Invalid payment status." };

  const order = await getOrderByRef(orderRef);
  if (!order) return { ok: false, error: "Order not found." };

  const current = await loadAxes(orderRef, order.status);
  const next: OrderAxes = { ...current, payment: payment as PaymentStatus };

  // Invariant: delivery can't stand on a non-paid order. If payment moves away
  // from 'paid', reset delivery so "delivered-but-unpaid" is impossible.
  if (next.payment !== "paid") next.delivery = "not_delivered";

  try {
    await persistAxes(orderRef, next);
    await recordAudit(admin, "order.payment_status", orderRef, { from: current.payment, to: next.payment });
    // Free stock if the payment won't complete; commit happens at submission.
    if (next.payment === "not_received" || next.payment === "pending") await releaseOrderStock(orderRef);
    revalidateStudioAndAccount(orderRef);
    return { ok: true };
  } catch (err) {
    console.error("[admin] setPaymentStatus failed", err);
    return { ok: false, error: "Update failed. Please try again." };
  }
}

// --- Delivery axis ----------------------------------------------------------
export async function setDeliveryStatus(orderRef: string, delivery: string): Promise<AdminActionResult> {
  const admin = await actingAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!orderRef || orderRef === "—") return { ok: false, error: "Invalid order reference." };
  if (!DELIVERY_STEPS.includes(delivery as DeliveryStatus)) return { ok: false, error: "Invalid delivery status." };

  const order = await getOrderByRef(orderRef);
  if (!order) return { ok: false, error: "Order not found." };

  const current = await loadAxes(orderRef, order.status);
  // Server-side gate: delivery is only editable on a paid, non-cancelled order.
  if (!deliveryEditable(current)) {
    return { ok: false, error: "Mark the order paid before setting delivery." };
  }

  try {
    await persistAxes(orderRef, { ...current, delivery: delivery as DeliveryStatus });
    await recordAudit(admin, "order.delivery_status", orderRef, { from: current.delivery, to: delivery });
    revalidateStudioAndAccount(orderRef);
    return { ok: true };
  } catch (err) {
    console.error("[admin] setDeliveryStatus failed", err);
    return { ok: false, error: "Update failed. Please try again." };
  }
}

// --- Cancel override --------------------------------------------------------
export async function setCancelled(orderRef: string, cancelled: boolean): Promise<AdminActionResult> {
  const admin = await actingAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!orderRef || orderRef === "—") return { ok: false, error: "Invalid order reference." };

  const order = await getOrderByRef(orderRef);
  if (!order) return { ok: false, error: "Order not found." };

  const current = await loadAxes(orderRef, order.status);
  try {
    await persistAxes(orderRef, { ...current, cancelled });
    await recordAudit(admin, cancelled ? "order.cancel" : "order.restore", orderRef);
    if (cancelled) await releaseOrderStock(orderRef);
    revalidateStudioAndAccount(orderRef);
    return { ok: true };
  } catch (err) {
    console.error("[admin] setCancelled failed", err);
    return { ok: false, error: "Update failed. Please try again." };
  }
}

// --- Guarded, once-only payment confirmation email --------------------------
export async function sendPaymentConfirmation(orderRef: string): Promise<AdminActionResult> {
  const admin = await actingAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!orderRef || orderRef === "—") return { ok: false, error: "Invalid order reference." };

  const order = await getOrderByRef(orderRef);
  if (!order) return { ok: false, error: "Order not found." };

  const axes = await loadAxes(orderRef, order.status);
  if (axes.cancelled) return { ok: false, error: "This order is cancelled." };
  if (axes.payment !== "paid") return { ok: false, error: "Mark the order paid before confirming." };

  // Atomically CLAIM the single send slot. Only the caller whose UPDATE actually
  // sets confirmation_sent_at (from NULL) proceeds — a double-click, stale tab,
  // or second admin loses the race and is told it's already sent.
  let claimed = false;
  try {
    const rows = (await sql`
      INSERT INTO order_state (order_ref, payment_status, delivery_status, confirmation_sent_at, confirmed_by, updated_at)
      VALUES (${orderRef}, ${axes.payment}, ${axes.delivery}, now(), ${admin}, now())
      ON CONFLICT (order_ref) DO UPDATE SET
        confirmation_sent_at = now(),
        confirmed_by = ${admin},
        updated_at = now()
      WHERE order_state.confirmation_sent_at IS NULL
      RETURNING order_ref
    `) as { order_ref: string }[];
    claimed = rows.length > 0;
  } catch (err) {
    console.error("[admin] confirmation claim failed", err);
    return { ok: false, error: "Update failed. Please try again." };
  }
  if (!claimed) return { ok: false, error: "A confirmation has already been sent for this order." };

  // Send. If it fails, RELEASE the slot so it stays retryable — never burn the
  // one shot on an email that didn't leave.
  const sent = await sendPaymentConfirmed({
    to: order.email,
    name: order.name,
    orderRef,
    items: order.items.map((i) => ({ product_slug: i.slug, size: i.size, quantity: i.quantity })),
    amount: order.total,
  });

  if (!sent.ok) {
    try {
      await sql`
        UPDATE order_state SET confirmation_sent_at = NULL, confirmed_by = NULL, updated_at = now()
        WHERE order_ref = ${orderRef}
      `;
    } catch (err) {
      console.error("[admin] confirmation slot release failed", err);
    }
    return { ok: false, error: `Email failed to send: ${sent.error}` };
  }

  await recordAudit(admin, "order.payment_confirmed", orderRef, { amount: order.total });
  revalidateStudioAndAccount(orderRef);
  return { ok: true };
}

// --- Manual, repeatable follow-up email -------------------------------------
export async function sendOrderFollowUp(
  orderRef: string,
  template: string,
  custom?: { subject?: string; body?: string },
): Promise<AdminActionResult> {
  const admin = await actingAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!orderRef || orderRef === "—") return { ok: false, error: "Invalid order reference." };
  if (!["shipped", "thank_you", "custom"].includes(template)) {
    return { ok: false, error: "Invalid follow-up template." };
  }

  const order = await getOrderByRef(orderRef);
  if (!order) return { ok: false, error: "Order not found." };

  const axes = await loadAxes(orderRef, order.status);
  if (axes.cancelled) return { ok: false, error: "This order is cancelled." };
  if (axes.payment !== "paid") return { ok: false, error: "Follow-ups are for paid orders only." };

  const sent = await sendFollowUp({
    to: order.email,
    name: order.name,
    orderRef,
    template: template as FollowUpTemplate,
    customBody: custom?.body,
    customSubject: custom?.subject,
  });
  if (!sent.ok) return { ok: false, error: `Email failed to send: ${sent.error}` };

  // Log the send (best-effort; the email already left).
  try {
    await sql`
      INSERT INTO follow_ups (order_ref, template, subject, sent_by)
      VALUES (${orderRef}, ${template}, ${sent.subject ?? null}, ${admin})
    `;
  } catch (err) {
    console.error("[admin] follow-up log failed", err);
  }

  await recordAudit(admin, "order.follow_up", orderRef, { template });
  revalidateStudioAndAccount(orderRef);
  return { ok: true };
}
