"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireMutator, recordAudit } from "@/lib/roles";

export type TeaserResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  id: z.coerce.number().int().optional(),
  label: z.string().trim().max(120),
  subtext: z.string().trim().max(200),
  imageUrl: z.string().trim().max(600),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  active: z.boolean().default(false),
});

function msg(e: unknown) {
  return String((e as { message?: string })?.message ?? e);
}

export async function saveTeaser(input: unknown): Promise<TeaserResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the fields." };
  const d = p.data;
  try {
    if (d.id) {
      await sql`UPDATE teasers SET label=${d.label}, subtext=${d.subtext}, image_url=${d.imageUrl}, sort_order=${d.sortOrder}, active=${d.active} WHERE id=${d.id}`;
    } else {
      await sql`INSERT INTO teasers (label, subtext, image_url, sort_order, active) VALUES (${d.label}, ${d.subtext}, ${d.imageUrl}, ${d.sortOrder}, ${d.active})`;
    }
  } catch (e) {
    return { ok: false, error: `Could not save: ${msg(e)}` };
  }
  await recordAudit(actor.email, d.id ? "teaser.update" : "teaser.create", String(d.id ?? d.label));
  revalidatePath("/shop");
  revalidatePath("/studio/teasers");
  return { ok: true };
}

export async function deleteTeaser(id: number): Promise<TeaserResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  try {
    await sql`DELETE FROM teasers WHERE id=${id}`;
  } catch (e) {
    return { ok: false, error: `Could not delete: ${msg(e)}` };
  }
  await recordAudit(actor.email, "teaser.delete", String(id));
  revalidatePath("/shop");
  revalidatePath("/studio/teasers");
  return { ok: true };
}

export async function toggleTeaser(id: number, active: boolean): Promise<TeaserResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  try {
    await sql`UPDATE teasers SET active=${active} WHERE id=${id}`;
  } catch (e) {
    return { ok: false, error: `Could not update: ${msg(e)}` };
  }
  await recordAudit(actor.email, "teaser.toggle", String(id), { active });
  revalidatePath("/shop");
  revalidatePath("/studio/teasers");
  return { ok: true };
}
