"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

const schema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only").min(1).max(120),
  name: z.string().trim().min(1, "Name is required").max(200),
  status: z.enum(["Preview", "Available", "Coming Soon"]),
  price_bdt: z.number().int().min(0).max(100000000),
  founding_note: z.string().trim().max(200).optional().or(z.literal("")),
  color: z.string().trim().min(1, "Color is required").max(120),
  swatches: z
    .array(z.object({ name: z.string().trim().min(1, "Each colour swatch needs a name").max(80), hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Hex like #003153") }))
    .max(12),
  short: z.string().trim().min(1, "Description is required").max(2000),
  images: z.array(z.string().trim().url()).max(12),
  sort_order: z.number().int().min(0).max(100000),
});

export type ProductInput = z.infer<typeof schema>;
export type ProductActionResult = { ok: true } | { ok: false; error: string };

async function isAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  return Boolean(session && isAdminEmail(session.user.email));
}

function revalidateAll(slug: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/studio/products");
}

export async function createProduct(input: ProductInput): Promise<ProductActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;
  try {
    await sql`
      INSERT INTO products (slug, name, status, price_bdt, founding_note, color, swatches, short, images, sort_order)
      VALUES (${d.slug}, ${d.name}, ${d.status}, ${d.price_bdt}, ${d.founding_note || null}, ${d.color},
              ${JSON.stringify(d.swatches)}::jsonb, ${d.short}, ${JSON.stringify(d.images)}::jsonb, ${d.sort_order})
    `;
  } catch (err) {
    const msg = String((err as { message?: string })?.message ?? err);
    if (/unique|duplicate|23505/i.test(msg)) return { ok: false, error: "A product with that slug already exists." };
    console.error("[products-admin] create failed", err);
    return { ok: false, error: "Could not create the product." };
  }
  revalidateAll(d.slug);
  return { ok: true };
}

export async function updateProduct(input: ProductInput): Promise<ProductActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;
  try {
    await sql`
      UPDATE products SET
        name = ${d.name}, status = ${d.status}, price_bdt = ${d.price_bdt},
        founding_note = ${d.founding_note || null}, color = ${d.color},
        swatches = ${JSON.stringify(d.swatches)}::jsonb, short = ${d.short},
        images = ${JSON.stringify(d.images)}::jsonb, sort_order = ${d.sort_order},
        updated_at = now()
      WHERE slug = ${d.slug}
    `;
  } catch (err) {
    console.error("[products-admin] update failed", err);
    return { ok: false, error: "Could not save changes." };
  }
  revalidateAll(d.slug);
  return { ok: true };
}

export async function deleteProduct(slug: string): Promise<ProductActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." };
  try {
    await sql`DELETE FROM products WHERE slug = ${slug}`;
  } catch (err) {
    console.error("[products-admin] delete failed", err);
    return { ok: false, error: "Could not delete the product." };
  }
  revalidateAll(slug);
  return { ok: true };
}

export type EditableProduct = {
  slug: string;
  name: string;
  status: "Preview" | "Available" | "Coming Soon";
  price_bdt: number;
  founding_note: string;
  color: string;
  swatches: { name: string; hex: string }[];
  short: string;
  images: string[];
  sort_order: number;
};

export async function getProductForEdit(slug: string): Promise<EditableProduct | null> {
  if (!(await isAdmin())) return null;
  try {
    const rows = (await sql`
      SELECT slug, name, status, price_bdt, founding_note, color, swatches, short, images, sort_order
      FROM products WHERE slug = ${slug}
    `) as EditableProduct[];
    const r = rows[0];
    if (!r) return null;
    return {
      ...r,
      founding_note: r.founding_note ?? "",
      swatches: Array.isArray(r.swatches) ? r.swatches : [],
      images: Array.isArray(r.images) ? r.images : [],
    };
  } catch (err) {
    console.error("[products-admin] getProductForEdit failed", err);
    return null;
  }
}
