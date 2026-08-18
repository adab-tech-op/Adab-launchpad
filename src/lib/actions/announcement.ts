"use server";

import { z } from "zod";
import { sql } from "@/lib/db";
import { requireMutator, recordAudit } from "@/lib/roles";

export type AnnouncementResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  enabled: z.boolean(),
  eyebrow: z.string().trim().max(120),
  title: z.string().trim().min(1, "Title can't be empty.").max(200),
  body: z.string().trim().max(500),
  pages: z.array(z.string().trim().max(80)).max(20),
  frequency: z.enum(["once", "session", "always"]),
});

/** Root/admin only. Updates the single announcement row and busts its cache. */
export async function saveAnnouncement(input: unknown): Promise<AnnouncementResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const d = parsed.data;

  try {
    await sql`
      INSERT INTO announcement (id, enabled, eyebrow, title, body, pages, frequency, updated_at)
      VALUES (1, ${d.enabled}, ${d.eyebrow}, ${d.title}, ${d.body}, ${d.pages}, ${d.frequency}, now())
      ON CONFLICT (id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        eyebrow = EXCLUDED.eyebrow,
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        pages = EXCLUDED.pages,
        frequency = EXCLUDED.frequency,
        updated_at = now()
    `;
    await recordAudit(actor.email, "announcement.update", null, {
      enabled: d.enabled,
      frequency: d.frequency,
      pages: d.pages.length,
    });
    return { ok: true };
  } catch (err) {
    console.error("[announcement] save failed", err);
    return { ok: false, error: "Could not save. Please try again." };
  }
}
