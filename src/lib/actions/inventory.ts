"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireMutator, recordAudit } from "@/lib/roles";

export type InventoryResult = { ok: true } | { ok: false; error: string };

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

const stockSchema = z.record(z.enum(SIZES), z.coerce.number().int().min(0).max(100000));

/** Root/admin. Upserts per-size stock for a product. */
export async function saveProductStock(slug: string, stock: unknown): Promise<InventoryResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  const parsed = stockSchema.safeParse(stock);
  if (!parsed.success) return { ok: false, error: "Stock values must be whole numbers." };
  const entries = Object.entries(parsed.data);
  try {
    for (const [size, qty] of entries) {
      await sql`
        INSERT INTO product_sizes (product_slug, size, stock)
        VALUES (${slug}, ${size}, ${qty})
        ON CONFLICT (product_slug, size) DO UPDATE SET stock = EXCLUDED.stock
      `;
    }
    await recordAudit(actor.email, "stock.update", slug);
    revalidatePath(`/product/${slug}`);
    revalidatePath("/studio/products");
    return { ok: true };
  } catch (err) {
    console.error("[inventory] saveProductStock failed", err);
    return { ok: false, error: "Could not save stock. Make sure db/inventory.sql has been run." };
  }
}

/** Root/admin. Marks a product sold out. IRREVERSIBLE by design — there is no
 *  action to unset it, protecting a genuinely gone drop from being reopened. */
export async function markSoldOut(slug: string): Promise<InventoryResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  try {
    await sql`UPDATE products SET sold_out = true WHERE slug = ${slug}`;
    await recordAudit(actor.email, "product.sold_out", slug);
    revalidatePath(`/product/${slug}`);
    revalidatePath("/shop");
    revalidatePath("/latest");
    revalidatePath("/studio/products");
    return { ok: true };
  } catch (err) {
    console.error("[inventory] markSoldOut failed", err);
    return { ok: false, error: "Could not mark sold out." };
  }
}
