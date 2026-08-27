"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireMutator, recordAudit } from "@/lib/roles";

export type PageContentResult = { ok: true } | { ok: false; error: string };

const blockSchema = z.object({
  title: z.string().trim().max(200),
  body: z.string().trim().max(4000),
});

// Each page has a known shape; validate against it before storing.
const shapes = {
  manifesto: z.object({
    hero: z.object({
      image: z.string().trim().max(600),
      eyebrow: z.string().trim().max(120),
      heading: z.string().trim().max(400),
      subcopy: z.string().trim().max(1000),
      textTheme: z.enum(["light", "dark"]),
      scrim: z.coerce.number().int().min(0).max(80),
    }),
    storyParts: z.array(blockSchema).max(12),
    values: z.array(blockSchema).max(12),
  }),
  care: z.object({
    sections: z.array(blockSchema).max(12),
  }),
} as const;

type Slug = keyof typeof shapes;

/** Root/admin only. Saves the editable blocks for a page. */
export async function savePageContent(slug: string, content: unknown): Promise<PageContentResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };

  const shape = shapes[slug as Slug];
  if (!shape) return { ok: false, error: "Unknown page." };

  const parsed = shape.safeParse(content);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the content." };

  try {
    await sql`
      INSERT INTO page_content (slug, content, updated_at)
      VALUES (${slug}, ${JSON.stringify(parsed.data)}::jsonb, now())
      ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, updated_at = now()
    `;
    await recordAudit(actor.email, "content.update", slug);
    revalidatePath(slug === "manifesto" ? "/manifesto" : "/care-guide");
    revalidatePath("/studio/content");
    return { ok: true };
  } catch (err) {
    console.error("[page-content] save failed", err);
    return { ok: false, error: "Could not save. Please try again." };
  }
}
