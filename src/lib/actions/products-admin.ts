"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireMutator, recordAudit } from "@/lib/roles";

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
  details: z.array(z.string().trim().min(1, "Empty detail line").max(200)).max(30),
  model_note: z.string().trim().max(300).optional().or(z.literal("")),
  fabric_note: z.string().trim().max(1000).optional().or(z.literal("")),
  story: z.string().trim().max(4000).optional().or(z.literal("")),
  fit_note: z.string().trim().max(2000).optional().or(z.literal("")),
  care_note: z.string().trim().max(2000).optional().or(z.literal("")),
  delivery_note: z.string().trim().max(2000).optional().or(z.literal("")),
  fabric_type_id: z.coerce.number().int().positive().nullable().optional(),
  sort_order: z.number().int().min(0).max(100000),
});

export type ProductInput = z.infer<typeof schema>;
export type ProductActionResult = { ok: true } | { ok: false; error: string };

/** Returns the acting admin's email if allowed to mutate (root/admin), else null.
 *  Moderators are view-only and refused. */
async function mutatorEmail(): Promise<string | null> {
  const actor = await requireMutator();
  return actor?.email ?? null;
}

function revalidateAll(slug: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/studio/products");
}

export async function createProduct(input: ProductInput): Promise<ProductActionResult> {
  const admin = await mutatorEmail();
  if (!admin) return { ok: false, error: "Not authorized." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;
  try {
    await sql`
      INSERT INTO products (slug, name, status, price_bdt, founding_note, color, swatches, short, images, details, model_note, fabric_note, story, fit_note, care_note, delivery_note, fabric_type_id, sort_order)
      VALUES (${d.slug}, ${d.name}, ${d.status}, ${d.price_bdt}, ${d.founding_note || null}, ${d.color},
              ${JSON.stringify(d.swatches)}::jsonb, ${d.short}, ${JSON.stringify(d.images)}::jsonb,
              ${JSON.stringify(d.details)}::jsonb, ${d.model_note || null}, ${d.fabric_note || null}, ${d.story || null},
              ${d.fit_note || null}, ${d.care_note || null}, ${d.delivery_note || null}, ${d.fabric_type_id ?? null}, ${d.sort_order})
    `;
  } catch (err) {
    const msg = String((err as { message?: string })?.message ?? err);
    if (/unique|duplicate|23505/i.test(msg)) return { ok: false, error: "A product with that slug already exists." };
    console.error("[products-admin] create failed", err);
    // Surface the real cause to the admin (trusted, mutator-gated). A common one:
    // "column ... does not exist" means a pending migration (e.g. product-details.sql).
    return { ok: false, error: `Could not create the product: ${msg}` };
  }
  await recordAudit(admin, "product.create", d.slug, { name: d.name });
  revalidateAll(d.slug);
  return { ok: true };
}

export async function updateProduct(input: ProductInput): Promise<ProductActionResult> {
  const admin = await mutatorEmail();
  if (!admin) return { ok: false, error: "Not authorized." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;
  try {
    await sql`
      UPDATE products SET
        name = ${d.name}, status = ${d.status}, price_bdt = ${d.price_bdt},
        founding_note = ${d.founding_note || null}, color = ${d.color},
        swatches = ${JSON.stringify(d.swatches)}::jsonb, short = ${d.short},
        images = ${JSON.stringify(d.images)}::jsonb, details = ${JSON.stringify(d.details)}::jsonb,
        model_note = ${d.model_note || null}, fabric_note = ${d.fabric_note || null},
        story = ${d.story || null},
        fit_note = ${d.fit_note || null}, care_note = ${d.care_note || null}, delivery_note = ${d.delivery_note || null},
        fabric_type_id = ${d.fabric_type_id ?? null},
        sort_order = ${d.sort_order}, updated_at = now()
      WHERE slug = ${d.slug}
    `;
  } catch (err) {
    const msg = String((err as { message?: string })?.message ?? err);
    console.error("[products-admin] update failed", err);
    return { ok: false, error: `Could not save changes: ${msg}` };
  }
  await recordAudit(admin, "product.update", d.slug, { name: d.name });
  revalidateAll(d.slug);
  return { ok: true };
}

export async function deleteProduct(slug: string): Promise<ProductActionResult> {
  const admin = await mutatorEmail();
  if (!admin) return { ok: false, error: "Not authorized." };
  try {
    await sql`DELETE FROM products WHERE slug = ${slug}`;
  } catch (err) {
    console.error("[products-admin] delete failed", err);
    return { ok: false, error: "Could not delete the product." };
  }
  await recordAudit(admin, "product.delete", slug);
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
  details: string[];
  model_note: string;
  fabric_note: string;
  story: string;
  fit_note: string;
  care_note: string;
  delivery_note: string;
  fabric_type_id: number | null;
  sort_order: number;
};

export async function getProductForEdit(slug: string): Promise<EditableProduct | null> {
  if (!(await mutatorEmail())) return null;
  try {
    const rows = (await sql`
      SELECT slug, name, status, price_bdt, founding_note, color, swatches, short, images, details, model_note, fabric_note, story, fit_note, care_note, delivery_note, fabric_type_id, sort_order
      FROM products WHERE slug = ${slug}
    `) as EditableProduct[];
    const r = rows[0];
    if (!r) return null;
    return {
      ...r,
      founding_note: r.founding_note ?? "",
      swatches: Array.isArray(r.swatches) ? r.swatches : [],
      images: Array.isArray(r.images) ? r.images : [],
      details: Array.isArray(r.details) ? r.details : [],
      model_note: r.model_note ?? "",
      fabric_note: r.fabric_note ?? "",
      story: r.story ?? "",
      fit_note: r.fit_note ?? "",
      care_note: r.care_note ?? "",
      delivery_note: r.delivery_note ?? "",
      fabric_type_id: r.fabric_type_id ?? null,
    };
  } catch (err) {
    console.error("[products-admin] getProductForEdit failed", err);
    return null;
  }
}
