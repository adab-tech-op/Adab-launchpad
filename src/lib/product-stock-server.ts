import "server-only";
import { sql } from "@/lib/db";

export type SizeStock = Record<string, number>;

/** size → stock for a product. Empty map if the table is missing (pre-migration)
 *  or the product has no stock rows yet (treated as "not tracked"). */
export async function getProductStock(slug: string): Promise<SizeStock> {
  try {
    const rows = (await sql`SELECT size, stock FROM product_sizes WHERE product_slug = ${slug}`) as { size: string; stock: number }[];
    const map: SizeStock = {};
    for (const r of rows) map[r.size] = r.stock;
    return map;
  } catch {
    return {};
  }
}

/** Decrement stock for an order exactly once (Option C: at payment submission).
 *  Claims the commit atomically via order_state.stock_committed so a payment
 *  re-submit can't double-decrement. Guarded per line (never goes negative);
 *  untracked sizes are skipped. Tolerant + never throws. */
export async function commitOrderStock(orderRef: string): Promise<void> {
  try {
    const claimed = (await sql`
      UPDATE order_state SET stock_committed = true
      WHERE order_ref = ${orderRef} AND stock_committed = false
      RETURNING order_ref
    `) as { order_ref: string }[];
    if (!claimed.length) return; // already committed, or no order_state row
    const lines = (await sql`
      SELECT product_slug, size, quantity FROM reservations WHERE order_ref = ${orderRef}
    `) as { product_slug: string; size: string; quantity: number }[];
    for (const l of lines) {
      const dec = (await sql`
        UPDATE product_sizes SET stock = stock - ${l.quantity}
        WHERE product_slug = ${l.product_slug} AND size = ${l.size} AND stock >= ${l.quantity}
        RETURNING stock
      `) as { stock: number }[];
      if (!dec.length) {
        console.warn(`[stock] not decremented ${l.product_slug}/${l.size} order ${orderRef} (untracked or oversold)`);
      }
    }
  } catch (err) {
    console.error("[stock] commit skipped/failed", err);
  }
}

/** Restore stock for an order if it was previously committed (cancel / payment
 *  not-received). Idempotent via the same stock_committed flag. Never throws. */
export async function releaseOrderStock(orderRef: string): Promise<void> {
  try {
    const claimed = (await sql`
      UPDATE order_state SET stock_committed = false
      WHERE order_ref = ${orderRef} AND stock_committed = true
      RETURNING order_ref
    `) as { order_ref: string }[];
    if (!claimed.length) return;
    const lines = (await sql`
      SELECT product_slug, size, quantity FROM reservations WHERE order_ref = ${orderRef}
    `) as { product_slug: string; size: string; quantity: number }[];
    for (const l of lines) {
      await sql`
        UPDATE product_sizes SET stock = stock + ${l.quantity}
        WHERE product_slug = ${l.product_slug} AND size = ${l.size}
      `;
    }
  } catch (err) {
    console.error("[stock] release skipped/failed", err);
  }
}
