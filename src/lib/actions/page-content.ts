"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireMutator, recordAudit } from "@/lib/roles";
import { deleteFromCloudinary } from "@/lib/cloudinary-server";

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

  // If the manifesto hero image is being replaced or removed, clean up the old
  // Cloudinary asset. Read the previous image before the write. Best-effort.
  let oldHeroImage: string | null = null;
  if (slug === "manifesto") {
    try {
      const rows = (await sql`SELECT content FROM page_content WHERE slug = ${slug}`) as { content: { hero?: { image?: string } } }[];
      oldHeroImage = rows[0]?.content?.hero?.image ?? null;
    } catch {
      oldHeroImage = null;
    }
  }

  try {
    await sql`
      INSERT INTO page_content (slug, content, updated_at)
      VALUES (${slug}, ${JSON.stringify(parsed.data)}::jsonb, now())
      ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, updated_at = now()
    `;
    await recordAudit(actor.email, "content.update", slug);
    if (slug === "manifesto") {
      const newHeroImage = (parsed.data as { hero?: { image?: string } })?.hero?.image ?? "";
      if (oldHeroImage && oldHeroImage !== newHeroImage) await deleteFromCloudinary(oldHeroImage);
    }
    revalidatePath(slug === "manifesto" ? "/manifesto" : "/care-guide");
    revalidatePath("/studio/content");
    return { ok: true };
  } catch (err) {
    console.error("[page-content] save failed", err);
    return { ok: false, error: "Could not save. Please try again." };
  }
}
