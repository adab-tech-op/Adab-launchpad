// Client-safe pricing helpers (no server-only imports) so product cards, the
// PDP, and server reads all compute the sale identically.

export function formatPrice(n: number): string {
  return `৳ ${n.toLocaleString("en-US")}`;
}

export type Sale = {
  onSale: boolean;
  pct: number;
  original: number; // original price in BDT
  salePrice: number; // effective price in BDT (== original when not on sale)
};

/** A product's L1 sale state. Active when percent > 0 and any expiry is in the
 *  future. Rounds to the nearest whole taka. */
export function saleFor(priceBdt: number, discountPercent?: number | null, discountUntil?: string | null): Sale {
  const pct = discountPercent ?? 0;
  const active = pct > 0 && (!discountUntil || new Date(discountUntil).getTime() > Date.now());
  const salePrice = active ? Math.round(priceBdt * (1 - pct / 100)) : priceBdt;
  return { onSale: active, pct, original: priceBdt, salePrice };
}
