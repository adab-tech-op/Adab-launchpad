"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireMutator, recordAudit } from "@/lib/roles";
import { deleteFromCloudinary } from "@/lib/cloudinary-server";

export type ScrapbookResult = { ok: true } | { ok: false; error: string };

function revalidate() {
  revalidatePath("/scrapbook");
  revalidatePath("/studio/scrapbook");
}

const addSchema = z.object({
  image_url: z.string().trim().url("A valid image URL is required.").max(600),
  caption: z.string().trim().max(200).optional(),
  caption_bn: z.string().trim().max(200).optional().default(""),
  place: z.string().trim().max(120).optional().default(""),
  taken_on: z.string().trim().max(60).optional().default(""),
  credit: z.string().trim().max(80).optional().default(""),
  kind: z.enum(["photo", "object"]).optional().default("photo"),
  span: z.enum(["normal", "tall", "wide"]).optional().default("normal"),
  group_label: z.string().trim().max(80).optional().default(""),
  col_start: z.coerce.number().int().min(0).max(11).optional().default(0),
  col_span: z.coerce.number().int().min(2).max(12).optional().default(4),
  nudge_y: z.coerce.number().int().min(-240).max(240).optional().default(0),
  rotation: z.coerce.number().min(-4).max(4).optional().default(0),
});

export async function addScrapbookImage(input: unknown): Promise<ScrapbookResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  const p = addSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the image." };
  try {
    // Append to the end of the current order.
    await sql`
      INSERT INTO scrapbook_images (image_url, caption, caption_bn, place, taken_on, credit, kind, span, group_label, col_start, col_span, nudge_y, rotation, sort_order)
      VALUES (
        ${p.data.image_url}, ${p.data.caption ?? ""}, ${p.data.caption_bn}, ${p.data.place}, ${p.data.taken_on},
        ${p.data.credit}, ${p.data.kind}, ${p.data.span}, ${p.data.group_label},
        ${p.data.col_start}, ${p.data.col_span}, ${p.data.nudge_y}, ${p.data.rotation},
        COALESCE((SELECT MAX(sort_order) + 1 FROM scrapbook_images), 1)
      )
    `;
    await recordAudit(actor.email, "scrapbook.add", null);
    revalidate();
    return { ok: true };
  } catch (err) {
    console.error("[scrapbook] add failed", err);
    return { ok: false, error: "Could not add — make sure db/scrapbook.sql has been run." };
  }
}

const updateSchema = z.object({
  caption: z.string().trim().max(200),
  caption_bn: z.string().trim().max(200).optional().default(""),
  place: z.string().trim().max(120).optional().default(""),
  taken_on: z.string().trim().max(60).optional().default(""),
  credit: z.string().trim().max(80).optional().default(""),
  kind: z.enum(["photo", "object"]).optional().default("photo"),
  span: z.enum(["normal", "tall", "wide"]).optional().default("normal"),
  group_label: z.string().trim().max(80).optional().default(""),
  col_start: z.coerce.number().int().min(0).max(11).optional().default(0),
  col_span: z.coerce.number().int().min(2).max(12).optional().default(4),
  nudge_y: z.coerce.number().int().min(-240).max(240).optional().default(0),
  rotation: z.coerce.number().min(-4).max(4).optional().default(0),
  sort_order: z.coerce.number().int().min(0).max(100000),
});

export async function updateScrapbookImage(id: number, input: unknown): Promise<ScrapbookResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  const p = updateSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the fields." };
  try {
    await sql`
      UPDATE scrapbook_images
      SET caption = ${p.data.caption}, caption_bn = ${p.data.caption_bn}, place = ${p.data.place},
          taken_on = ${p.data.taken_on}, credit = ${p.data.credit}, kind = ${p.data.kind},
          span = ${p.data.span}, group_label = ${p.data.group_label}, col_start = ${p.data.col_start},
          col_span = ${p.data.col_span}, nudge_y = ${p.data.nudge_y}, rotation = ${p.data.rotation},
          sort_order = ${p.data.sort_order}
      WHERE id = ${id}`;
    await recordAudit(actor.email, "scrapbook.update", String(id));
    revalidate();
    return { ok: true };
  } catch (err) {
    console.error("[scrapbook] update failed", err);
    return { ok: false, error: "Could not save." };
  }
}

export async function deleteScrapbookImage(id: number): Promise<ScrapbookResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  try {
    // Read the URL first so we can clean up the asset after the row is gone.
    let url: string | null = null;
    try {
      const rows = (await sql`SELECT image_url FROM scrapbook_images WHERE id = ${id}`) as { image_url: string }[];
      url = rows[0]?.image_url ?? null;
    } catch {
      url = null;
    }
    await sql`DELETE FROM scrapbook_images WHERE id = ${id}`;
    await recordAudit(actor.email, "scrapbook.delete", String(id));
    await deleteFromCloudinary(url); // best-effort; no-ops for /assets seeds
    revalidate();
    return { ok: true };
  } catch (err) {
    console.error("[scrapbook] delete failed", err);
    return { ok: false, error: "Could not delete." };
  }
}
