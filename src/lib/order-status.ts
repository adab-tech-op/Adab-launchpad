// Shared order-status vocabulary — pure, no server-only, safe on client + server.
//
// The order's real state is two independent axes plus a cancel override, held in
// the order_state table. The legacy reservations.status column is a DERIVED
// MIRROR of these (so customer views keep working). This module is the single
// source of truth for both directions of that mapping and for labels/colors.

export const PAYMENT_STEPS = ["pending", "submitted", "paid", "not_received"] as const;
export const DELIVERY_STEPS = ["not_delivered", "shipped", "delivered"] as const;

export type PaymentStatus = (typeof PAYMENT_STEPS)[number];
export type DeliveryStatus = (typeof DELIVERY_STEPS)[number];

export type OrderAxes = {
  payment: PaymentStatus;
  delivery: DeliveryStatus;
  cancelled: boolean;
};

/** Legacy single-status values (the reservations.status CHECK constraint). */
export type LegacyStatus =
  | "pending"
  | "payment_submitted"
  | "paid"
  | "payment_not_received"
  | "delivered"
  | "cancelled";

/** Derive the two-axis view from a legacy status — the fallback when an order
 *  has no order_state row yet (old data pre-migration, or a brief ordering gap). */
export function axesFromLegacy(status: string): OrderAxes {
  switch (status) {
    case "payment_submitted":
      return { payment: "submitted", delivery: "not_delivered", cancelled: false };
    case "paid":
      return { payment: "paid", delivery: "not_delivered", cancelled: false };
    case "delivered":
      return { payment: "paid", delivery: "delivered", cancelled: false };
    case "payment_not_received":
      return { payment: "not_received", delivery: "not_delivered", cancelled: false };
    case "cancelled":
      return { payment: "pending", delivery: "not_delivered", cancelled: true };
    default:
      return { payment: "pending", delivery: "not_delivered", cancelled: false };
  }
}

/** Collapse the two axes back to a single legacy status, for the mirror column
 *  that customer-facing views + StatusBadge read. Cancelled wins over all. */
export function legacyFromAxes(a: OrderAxes): LegacyStatus {
  if (a.cancelled) return "cancelled";
  if (a.payment === "not_received") return "payment_not_received";
  if (a.payment === "pending") return "pending";
  if (a.payment === "submitted") return "payment_submitted";
  // payment === 'paid'
  if (a.delivery === "delivered") return "delivered";
  return "paid"; // paid, including 'shipped' (legacy has no shipped bucket)
}

// Labels -----------------------------------------------------------------------
export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "awaiting payment",
  submitted: "submitted",
  paid: "paid",
  not_received: "not received",
};

export const DELIVERY_LABELS: Record<DeliveryStatus, string> = {
  not_delivered: "not delivered",
  shipped: "shipped",
  delivered: "delivered",
};

// Pill color classes (Tailwind, matching the site's tokens) --------------------
export const PAYMENT_PILL: Record<PaymentStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  submitted: "bg-[color:var(--steel)]/15 text-[color:var(--steel)]",
  paid: "bg-emerald-600/12 text-emerald-700",
  not_received: "bg-destructive/10 text-destructive",
};

export const DELIVERY_PILL: Record<DeliveryStatus, string> = {
  not_delivered: "bg-muted text-muted-foreground",
  shipped: "bg-[color:var(--steel)]/15 text-[color:var(--steel)]",
  delivered: "bg-emerald-600/12 text-emerald-700",
};

/** Delivery may only advance once payment is verified as paid. Enforced in the
 *  server action too — this is the shared predicate the UI uses to disable. */
export function deliveryEditable(a: Pick<OrderAxes, "payment" | "cancelled">): boolean {
  return a.payment === "paid" && !a.cancelled;
}
