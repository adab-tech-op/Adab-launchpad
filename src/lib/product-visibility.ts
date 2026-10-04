import { dropStateOf, formatDhaka, type DropState } from "@/lib/drop";
import type { Product } from "@/data/products";

/**
 * What a visitor actually sees, in one sentence.
 *
 * Status, drop date, drop end and the in-shop flag decide this between them,
 * and nothing in Studio said what the combination added up to — the list
 * showed a bare word ("Preview") and the form showed four separate controls.
 * Both now ask this.
 */
export type VisibilityFields = Pick<Product, "status" | "dropDate" | "dropEnd" | "inShop">;

/** Short label for a list row. */
export function visibilityLabel(p: VisibilityFields, windowDays: number, now = new Date()): string {
  const state = dropStateOf(p, windowDays, now);
  switch (state) {
    case "upcoming":
      return p.dropDate ? `Drops ${formatDhaka(p.dropDate)}` : "Scheduled";
    case "available":
      return "Live, in the drop";
    case "concluded":
      return p.inShop ? "Live in Shop, drop ended" : "Drop ended, hidden";
    case "hidden":
      return "Hidden";
    default:
      break;
  }
  if (p.status === "Available") return "Live in Shop";
  if (p.status === "Coming Soon") return "Coming soon, not buyable";
  return "Preview only, not buyable";
}

/** Whether this row should read as needing attention. */
export function visibilityIsLive(p: VisibilityFields, windowDays: number, now = new Date()): boolean {
  const state: DropState = dropStateOf(p, windowDays, now);
  if (state === "available") return true;
  if (state === "concluded") return !!p.inShop;
  if (state === "none") return p.status === "Available";
  return false;
}

/** The long form: the whole consequence of the current settings, for the form. */
export function visibilitySentence(p: VisibilityFields, windowDays: number, now = new Date()): string {
  const state = dropStateOf(p, windowDays, now);
  const after = p.inShop
    ? " It moves to the shop when the drop ends."
    : " When the drop ends it disappears from the site unless you tick the box above.";

  switch (state) {
    case "upcoming":
      return (
        `Nobody can buy this yet. It appears on the Drop page with a countdown and becomes buyable at ` +
        `${formatDhaka(p.dropDate!)}.` +
        after
      );
    case "available":
      return `This is live on the Drop page and can be bought now.` + after;
    case "concluded":
      return p.inShop
        ? "The drop has ended. This now sits in the shop and can be bought."
        : "The drop has ended and this is no longer visible anywhere. Tick the box above to move it into the shop.";
    case "hidden":
      return "This is hidden from the site. Nobody can see it.";
    default:
      break;
  }
  if (p.status === "Available") return "This is live in the shop and can be bought now.";
  if (p.status === "Coming Soon") return "This shows in the shop as coming soon. Nobody can buy it.";
  return "This shows on the site but cannot be bought. Set a drop date, or change this to live, when you are ready.";
}

/** "12 in stock. XL cannot be reserved. XXL is untracked." */
export function stockSummary(stock: Record<string, number>, sizes: string[]): string {
  const tracked = sizes.filter((s) => s in stock);
  if (tracked.length === 0) return "Stock is not tracked for any size.";
  const total = tracked.reduce((sum, s) => sum + (stock[s] ?? 0), 0);
  const out = tracked.filter((s) => (stock[s] ?? 0) <= 0);
  const untracked = sizes.filter((s) => !(s in stock));

  const parts = [`${total} in stock across ${tracked.length} ${tracked.length === 1 ? "size" : "sizes"}.`];
  if (out.length) parts.push(`${out.join(", ")} cannot be reserved.`);
  if (untracked.length) parts.push(`${untracked.join(", ")} untracked, so always available.`);
  return parts.join(" ");
}

/** Shorter version for a list row, flagged when it needs attention. */
export function stockLabel(stock: Record<string, number>, sizes: string[]): { text: string; low: boolean } {
  const tracked = sizes.filter((s) => s in stock);
  if (tracked.length === 0) return { text: "Not tracked", low: false };
  const total = tracked.reduce((sum, s) => sum + (stock[s] ?? 0), 0);
  const out = tracked.filter((s) => (stock[s] ?? 0) <= 0);
  if (out.length) return { text: `${total} left, ${out.join(" and ")} out`, low: true };
  return { text: `${total} across ${tracked.length} ${tracked.length === 1 ? "size" : "sizes"}`, low: total <= 5 };
}
