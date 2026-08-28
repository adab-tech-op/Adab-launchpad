import "server-only";
import { sql } from "@/lib/db";
import { getProductMap } from "@/lib/products";
import { saleFor } from "@/lib/pricing";

export type CouponRow = {
  id: number;
  code: string;
  percent: number;
  product_slug: string | null;
  active: boolean;
  expires_at: string | null;
  max_uses: number | null;
};

export type ValidCoupon = { id: number; code: string; percent: number; productSlug: string | null };

export type OrderItem = { product_slug: string; size: string; quantity: number };

export function normalizeCode(s: string): string {
  return s.trim().toUpperCase().replace(/\s+/g, "");
}

function priceToNumber(price?: string): number {
  return Number((price ?? "").replace(/[^0-9]/g, "")) || 0;
}

/** Validate a code against the cart + email. Only committed redemptions count
 *  toward caps / once-per-email, so unpaid attempts never block. Tolerant. */
export async function validateCoupon(
  codeRaw: string,
  items: OrderItem[],
  email: string,
): Promise<{ ok: true; coupon: ValidCoupon } | { ok: false; error: string }> {
  const code = normalizeCode(codeRaw);
  if (!code) return { ok: false, error: "Enter a code." };
  try {
    const rows = (await sql`
      SELECT id, code, percent, product_slug, active, expires_at, max_uses
      FROM coupon_codes WHERE code = ${code} LIMIT 1
    `) as CouponRow[];
    const c = rows[0];
    if (!c || !c.active) return { ok: false, error: "That code isn’t valid." };
    if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return { ok: false, error: "That code has expired." };
    if (c.product_slug && !items.some((it) => it.product_slug === c.product_slug)) {
      return { ok: false, error: "That code doesn’t apply to this item." };
    }
    if (c.max_uses != null) {
      const used = (await sql`SELECT COUNT(*)::int AS n FROM coupon_redemptions WHERE code_id = ${c.id} AND committed = true`) as { n: number }[];
      if ((used[0]?.n ?? 0) >= c.max_uses) return { ok: false, error: "That code has been fully claimed." };
    }
    const mine = (await sql`
      SELECT 1 FROM coupon_redemptions
      WHERE code_id = ${c.id} AND committed = true AND lower(email) = lower(${email}) LIMIT 1
    `) as unknown[];
    if (mine.length) return { ok: false, error: "You’ve already used this code." };
    return { ok: true, coupon: { id: c.id, code: c.code, percent: c.percent, productSlug: c.product_slug } };
  } catch (err) {
    console.error("[coupons] validate failed", err);
    return { ok: false, error: "Couldn’t check that code. Make sure db/coupons.sql has been run." };
  }
}

/** Compute the frozen price for an order: per item, take the BETTER of the L1
 *  product sale and the coupon (no stacking). Rounds to the nearest taka. */
export async function computeOrderPricing(
  items: OrderItem[],
  coupon: ValidCoupon | null,
): Promise<{ subtotal: number; amount: number; pct: number; code: string | null }> {
  const map = await getProductMap();
  let subtotal = 0;
  let amount = 0;
  for (const it of items) {
    const p = map.get(it.product_slug);
    const base = p?.priceBdt ?? priceToNumber(p?.price);
    const l1 = saleFor(base, p?.discountPercent, p?.discountUntil).salePrice;
    const applies = coupon && (!coupon.productSlug || coupon.productSlug === it.product_slug);
    const couponPrice = applies ? Math.round(base * (1 - coupon!.percent / 100)) : base;
    const unit = Math.min(l1, couponPrice); // best deal, not stacked
    subtotal += base * it.quantity;
    amount += unit * it.quantity;
  }
  const pct = subtotal > 0 ? Math.round((1 - amount / subtotal) * 100) : 0;
  return { subtotal, amount, pct, code: coupon?.code ?? null };
}

/** Freeze the price + (optional) coupon redemption for a new order. Called from
 *  createReservation. Best-effort; never throws so it can't break checkout. */
export async function freezeOrderPricing(
  orderRef: string,
  items: OrderItem[],
  email: string,
  coupon: ValidCoupon | null,
): Promise<void> {
  try {
    const pricing = await computeOrderPricing(items, coupon);
    await sql`
      INSERT INTO order_pricing (order_ref, subtotal_bdt, discount_code, discount_pct, amount_bdt)
      VALUES (${orderRef}, ${pricing.subtotal}, ${pricing.code}, ${pricing.pct}, ${pricing.amount})
      ON CONFLICT (order_ref) DO UPDATE SET
        subtotal_bdt = EXCLUDED.subtotal_bdt, discount_code = EXCLUDED.discount_code,
        discount_pct = EXCLUDED.discount_pct, amount_bdt = EXCLUDED.amount_bdt
    `;
    if (coupon) {
      await sql`
        INSERT INTO coupon_redemptions (code_id, order_ref, email, committed)
        VALUES (${coupon.id}, ${orderRef}, ${email}, false)
      `;
    }
  } catch (err) {
    console.error("[coupons] freeze failed", err);
  }
}

/** The frozen amount for an order, or null if none (older orders). */
export async function getFrozenPricing(orderRef: string): Promise<{ subtotal: number; amount: number; pct: number; code: string | null } | null> {
  try {
    const rows = (await sql`SELECT subtotal_bdt, discount_code, discount_pct, amount_bdt FROM order_pricing WHERE order_ref = ${orderRef}`) as {
      subtotal_bdt: number; discount_code: string | null; discount_pct: number; amount_bdt: number;
    }[];
    const r = rows[0];
    if (!r) return null;
    return { subtotal: r.subtotal_bdt, amount: r.amount_bdt, pct: r.discount_pct, code: r.discount_code };
  } catch {
    return null;
  }
}

/** Commit an order's coupon use at payment submission (#11-style). Guarded by
 *  cap. Never throws. */
export async function commitCoupon(orderRef: string): Promise<void> {
  try {
    const red = (await sql`SELECT id, code_id FROM coupon_redemptions WHERE order_ref = ${orderRef} AND committed = false LIMIT 1`) as { id: number; code_id: number }[];
    const r = red[0];
    if (!r) return;
    const capRows = (await sql`SELECT max_uses FROM coupon_codes WHERE id = ${r.code_id}`) as { max_uses: number | null }[];
    const cap = capRows[0]?.max_uses ?? null;
    if (cap != null) {
      const used = (await sql`SELECT COUNT(*)::int AS n FROM coupon_redemptions WHERE code_id = ${r.code_id} AND committed = true`) as { n: number }[];
      if ((used[0]?.n ?? 0) >= cap) {
        console.warn(`[coupons] cap reached for code ${r.code_id} — leaving order ${orderRef} redemption uncommitted`);
        return;
      }
    }
    await sql`UPDATE coupon_redemptions SET committed = true WHERE id = ${r.id}`;
  } catch (err) {
    console.error("[coupons] commit failed", err);
  }
}

/** Release an order's coupon use on cancel / not-received. Never throws. */
export async function releaseCoupon(orderRef: string): Promise<void> {
  try {
    await sql`UPDATE coupon_redemptions SET committed = false WHERE order_ref = ${orderRef}`;
  } catch (err) {
    console.error("[coupons] release failed", err);
  }
}

/** All coupons for the studio, with their committed use counts. */
export async function getCoupons(): Promise<(CouponRow & { committed_uses: number })[]> {
  try {
    const rows = (await sql`
      SELECT c.id, c.code, c.percent, c.product_slug, c.active, c.expires_at, c.max_uses,
        (SELECT COUNT(*)::int FROM coupon_redemptions r WHERE r.code_id = c.id AND r.committed = true) AS committed_uses
      FROM coupon_codes c ORDER BY c.created_at DESC
    `) as (CouponRow & { committed_uses: number })[];
    return rows;
  } catch {
    return [];
  }
}
