import "server-only";
import { sql } from "@/lib/db";
import { products as staticProducts, type Product } from "@/data/products";
import { formatPrice } from "@/lib/pricing";
import { getDropWindowDays } from "@/lib/settings-server";
import { dropStateOf, isShopVisible, isDropVisible } from "@/lib/drop";

export type { Product };
export { formatPrice };

type Row = {
  slug: string;
  name: string;
  status: Product["status"];
  price_bdt: number;
  founding_note: string | null;
  color: string;
  swatches: { name: string; hex: string }[];
  short: string;
  images: string[];
  details: string[] | null;
  model_note: string | null;
  fabric_note: string | null;
  sold_out: boolean | null;
  story: string | null;
  fit_note: string | null;
  care_note: string | null;
  delivery_note: string | null;
  fabric_type_id: number | null;
  discount_percent: number | null;
  discount_until: string | null;
  drop_date: string | null;
  drop_end: string | null;
  in_shop: boolean | null;
  drop_hero: unknown;
};

function rowToProduct(r: Row): Product {
  return {
    slug: r.slug,
    name: r.name,
    status: r.status,
    price: formatPrice(r.price_bdt),
    priceBdt: r.price_bdt,
    discountPercent: r.discount_percent ?? 0,
    discountUntil: r.discount_until ?? undefined,
    foundingNote: r.founding_note ?? undefined,
    color: r.color,
    swatches: Array.isArray(r.swatches) ? r.swatches : [],
    short: r.short,
    images: Array.isArray(r.images) ? r.images : [],
    details: Array.isArray(r.details) ? r.details : [],
    modelNote: r.model_note ?? undefined,
    fabricNote: r.fabric_note ?? undefined,
    soldOut: r.sold_out ?? false,
    story: r.story ?? undefined,
    fitNote: r.fit_note ?? undefined,
    careNote: r.care_note ?? undefined,
    deliveryNote: r.delivery_note ?? undefined,
    fabricTypeId: r.fabric_type_id ?? undefined,
    dropDate: r.drop_date ?? undefined,
    dropEnd: r.drop_end ?? undefined,
    inShop: r.in_shop ?? false,
    dropHero: (r.drop_hero && typeof r.drop_hero === "object") ? (r.drop_hero as import("@/lib/page-content").PageHero) : undefined,
  };
}

const PRODUCT_COLS = "slug, name, status, price_bdt, founding_note, color, swatches, short, images, details, model_note, fabric_note, story, fit_note, care_note, delivery_note, fabric_type_id, discount_percent, discount_until";

/** All products, DB-first with a static fallback if the table is empty or unreachable. */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const rows = (await sql`
      SELECT * FROM products ORDER BY sort_order, created_at
    `) as Row[];
    return rows.length ? rows.map(rowToProduct) : staticProducts;
  } catch (err) {
    console.error("[products] getAllProducts failed, using static fallback", err);
    return staticProducts;
  }
}

/** Newest products first, capped at `limit` — feeds the /latest page. Falls back
 *  to the static list (sliced) if the DB read fails or is empty. */
export async function getLatestProducts(limit: number): Promise<Product[]> {
  const n = Math.max(1, Math.min(50, Math.floor(limit) || 1));
  try {
    const rows = (await sql`
      SELECT * FROM products ORDER BY created_at DESC, sort_order LIMIT ${n}
    `) as Row[];
    if (rows.length) return rows.map(rowToProduct);
  } catch (err) {
    console.error("[products] getLatestProducts failed, using static fallback", err);
  }
  return staticProducts.slice(0, n);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const rows = (await sql`
      SELECT * FROM products WHERE slug = ${slug}
    `) as Row[];
    if (rows[0]) return rowToProduct(rows[0]);
  } catch (err) {
    console.error("[products] getProductBySlug failed, using static fallback", err);
  }
  return staticProducts.find((p) => p.slug === slug) ?? null;
}

/** Map of slug -> Product, for enriching order/email line items in one query. */
export async function getProductMap(): Promise<Map<string, Product>> {
  const all = await getAllProducts();
  return new Map(all.map((p) => [p.slug, p]));
}

export async function getProductSlugs(): Promise<string[]> {
  try {
    const rows = (await sql`SELECT slug FROM products ORDER BY sort_order`) as { slug: string }[];
    if (rows.length) return rows.map((r) => r.slug);
  } catch (err) {
    console.error("[products] getProductSlugs failed, using static fallback", err);
  }
  return staticProducts.map((p) => p.slug);
}

// ---- Drop-aware storefront reads --------------------------------------------

/** Products visible on /shop, home, search, sitemap (public):
 *  drop pieces only once live; concluded pieces only if resurfaced; pieces with
 *  no drop scheduled behave exactly as before. */
export async function getShopVisibleProducts(): Promise<Product[]> {
  const [all, windowDays] = await Promise.all([getAllProducts(), getDropWindowDays()]);
  const now = new Date();
  return all.filter((p) => isShopVisible(dropStateOf(p, windowDays, now), p.inShop));
}

export type DropProduct = Product & { state: "upcoming" | "available" };

/** Products for the /drop page, split and each tagged with its state.
 *  upcoming sorted by soonest drop_date; available sorted by most recent. */
export async function getDropProducts(): Promise<{ upcoming: DropProduct[]; available: DropProduct[] }> {
  const [all, windowDays] = await Promise.all([getAllProducts(), getDropWindowDays()]);
  const now = new Date();
  const upcoming: DropProduct[] = [];
  const available: DropProduct[] = [];
  for (const p of all) {
    const state = dropStateOf(p, windowDays, now);
    if (!isDropVisible(state)) continue;
    (state === "upcoming" ? upcoming : available).push({ ...p, state: state as "upcoming" | "available" });
  }
  upcoming.sort((a, b) => new Date(a.dropDate!).getTime() - new Date(b.dropDate!).getTime());
  available.sort((a, b) => new Date(b.dropDate!).getTime() - new Date(a.dropDate!).getTime());
  return { upcoming, available };
}

/** The next drop instant to count down to (soonest upcoming drop_date), or null. */
export async function getNextDropDate(): Promise<string | null> {
  const { upcoming } = await getDropProducts();
  return upcoming[0]?.dropDate ?? null;
}

/** The most recent concluded/past drop_date, for "previous drop … ago". */
export async function getPreviousDropDate(): Promise<string | null> {
  const all = await getAllProducts();
  const now = Date.now();
  const past = all
    .map((p) => p.dropDate)
    .filter((d): d is string => !!d && new Date(d).getTime() <= now)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return past[0] ?? null;
}
