/**
 * The job on the Orders page is matching a bKash payment against an order.
 * The page showed the expected amount, the payer number and the TrxID as four
 * plain values and left the comparing to the reader's eyes — in different
 * formats, since the customer's number is stored as +8801560036454 while bKash
 * reports 01560036454. These make the comparisons instead.
 */

export type Check = { ok: boolean; note: string };

/** Strip to digits and drop the Bangladesh country code, so +8801… and 01…
 *  compare as the same number. */
export function normaliseMsisdn(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("880")) return `0${digits.slice(3)}`;
  if (digits.startsWith("0")) return digits;
  if (digits.length === 10) return `0${digits}`;
  return digits;
}

/** Did the payment come from the number on the order? Not a failure when they
 *  differ — people pay from a spouse's or a shop's account — so this reports
 *  rather than blocks. */
export function payerCheck(paidFrom: string | null | undefined, customerPhone: string | null | undefined): Check | null {
  const a = normaliseMsisdn(paidFrom);
  const b = normaliseMsisdn(customerPhone);
  if (!a || !b) return null;
  return a === b
    ? { ok: true, note: "Same as the customer's number" }
    : { ok: false, note: `Paid from a different number. The order says ${b}.` };
}

/** The expected amount against what the items actually come to.
 *
 *  These are separate fields (`payment.amount` is what the customer was asked
 *  for; `total` is the sum of the lines today), and they can drift apart when a
 *  product is repriced or removed after the order was placed. The page showed
 *  both without remarking on it. */
export function amountCheck(expected: number, itemsTotal: number): Check | null {
  if (!Number.isFinite(expected) || !Number.isFinite(itemsTotal)) return null;
  if (expected === itemsTotal) return { ok: true, note: "Matches the items total" };
  return {
    ok: false,
    note:
      `The customer was asked for ৳ ${expected.toLocaleString()}, and the items now come to ` +
      `৳ ${itemsTotal.toLocaleString()}. Usually a product was repriced or removed after the order.`,
  };
}

/**
 * What a status change will do beyond changing the status.
 *
 * Marking a payment "not received" releases the reserved stock and frees the
 * coupon; moving payment away from "paid" resets delivery, because
 * delivered-but-unpaid is not a state the system allows. Both already happen
 * in setPaymentStatus. Neither was mentioned anywhere on the page, so a click
 * had consequences you could only discover afterwards.
 */
export function paymentSideEffects(next: string, current: { payment: string; delivery: string }): string[] {
  const out: string[] = [];
  const releases = next === "not_received" || next === "pending";
  if (releases) {
    // "any coupon" rather than naming one: the orders query does not carry
    // coupon data, and claiming a specific coupon exists would be worse than
    // describing the behaviour accurately.
    out.push("puts the reserved stock back");
    out.push("releases any coupon used on this order");
  }
  if (next !== "paid" && current.delivery !== "not_delivered") {
    out.push("resets the delivery status, since an unpaid order cannot be delivered");
  }
  return out;
}
