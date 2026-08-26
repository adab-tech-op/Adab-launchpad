import "server-only";
import { sql } from "@/lib/db";
import { products as staticProducts, type Product } from "@/data/products";

export type { Product };

export function formatPrice(n: number): string {
  return `৳ ${n.toLocaleString("en-US")}`;
}

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
  story: string | null;
  fit_note: string | null;
  care_note: string | null;
  delivery_note: string | null;
};

function rowToProduct(r: Row): Product {
  return {
    slug: r.slug,
    name: r.name,
    status: r.status,
    price: formatPrice(r.price_bdt),
    foundingNote: r.founding_note ?? undefined,
    color: r.color,
    swatches: Array.isArray(r.swatches) ? r.swatches : [],
    short: r.short,
    images: Array.isArray(r.images) ? r.images : [],
    details: Array.isArray(r.details) ? r.details : [],
    modelNote: r.model_note ?? undefined,
    fabricNote: r.fabric_note ?? undefined,
    story: r.story ?? undefined,
    fitNote: r.fit_note ?? undefined,
    careNote: r.care_note ?? undefined,
    deliveryNote: r.delivery_note ?? undefined,
  };
}

const PRODUCT_COLS = "slug, name, status, price_bdt, founding_note, color, swatches, short, images, details, model_note, fabric_note, story, fit_note, care_note, delivery_note";

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
