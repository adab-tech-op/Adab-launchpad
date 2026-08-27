"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireMutator, recordAudit } from "@/lib/roles";

export type FabricResult = { ok: true } | { ok: false; error: string };

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

const schema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  care_detail: z.string().trim().max(4000),
  sort_order: z.coerce.number().int().min(0).max(100000).optional(),
});

function revalidate() {
  revalidatePath("/care-guide");
  revalidatePath("/studio/fabrics");
}

export async function createFabricType(input: unknown): Promise<FabricResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the fields." };
  const slug = slugify(p.data.name);
  if (!slug) return { ok: false, error: "Name must contain letters or numbers." };
  try {
    await sql`
      INSERT INTO fabric_types (slug, name, care_detail, sort_order)
      VALUES (${slug}, ${p.data.name}, ${p.data.care_detail}, ${p.data.sort_order ?? 0})
    `;
    await recordAudit(actor.email, "fabric.create", slug);
    revalidate();
    return { ok: true };
  } catch (err) {
    console.error("[fabrics] create failed", err);
    return { ok: false, error: "Could not create — that name may already exist. (If this is the first one, make sure db/fabric-types.sql has been run.)" };
  }
}

export async function updateFabricType(id: number, input: unknown): Promise<FabricResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the fields." };
  try {
    // slug is the stable identifier — name/care/order can change, slug stays.
    await sql`
      UPDATE fabric_types
      SET name = ${p.data.name}, care_detail = ${p.data.care_detail}, sort_order = ${p.data.sort_order ?? 0}
      WHERE id = ${id}
    `;
    await recordAudit(actor.email, "fabric.update", String(id));
    revalidate();
    return { ok: true };
  } catch (err) {
    console.error("[fabrics] update failed", err);
    return { ok: false, error: "Could not save." };
  }
}

export async function deleteFabricType(id: number): Promise<FabricResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  try {
    // Products linked to this type are unlinked automatically (FK ON DELETE SET NULL).
    await sql`DELETE FROM fabric_types WHERE id = ${id}`;
    await recordAudit(actor.email, "fabric.delete", String(id));
    revalidate();
    return { ok: true };
  } catch (err) {
    console.error("[fabrics] delete failed", err);
    return { ok: false, error: "Could not delete." };
  }
}
