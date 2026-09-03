"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireMutator, recordAudit } from "@/lib/roles";
import { deleteFromCloudinary, deleteManyFromCloudinary } from "@/lib/cloudinary-server";

export type PageContentResult = { ok: true } | { ok: false; error: string };

const blockSchema = z.object({
  title: z.string().trim().max(200),
  body: z.string().trim().max(4000),
});

// Story parts also carry an optional paired image (Cloudinary URL). Without
// this, zod would strip the image key on save.
const storyBlockSchema = blockSchema.extend({
  image: z.string().trim().max(600).optional().default(""),
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
    storyParts: z.array(storyBlockSchema).max(12),
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

  // If the manifesto hero image or any story-part image is being replaced or
  // removed, clean up the orphaned Cloudinary asset(s). Read the previous
  // images before the write. Best-effort.
  let oldHeroImage: string | null = null;
  let oldStoryImages: string[] = [];
  if (slug === "manifesto") {
    try {
      const rows = (await sql`SELECT content FROM page_content WHERE slug = ${slug}`) as {
        content: { hero?: { image?: string }; storyParts?: { image?: string }[] };
      }[];
      oldHeroImage = rows[0]?.content?.hero?.image ?? null;
      oldStoryImages = (rows[0]?.content?.storyParts ?? [])
        .map((p) => p?.image)
        .filter((u): u is string => !!u);
    } catch {
      oldHeroImage = null;
      oldStoryImages = [];
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
      const data = parsed.data as { hero?: { image?: string }; storyParts?: { image?: string }[] };
      const newHeroImage = data?.hero?.image ?? "";
      if (oldHeroImage && oldHeroImage !== newHeroImage) await deleteFromCloudinary(oldHeroImage);
      const newStoryImages = new Set(
        (data?.storyParts ?? []).map((p) => p?.image).filter((u): u is string => !!u),
      );
      const removedStoryImages = oldStoryImages.filter((u) => !newStoryImages.has(u));
      if (removedStoryImages.length) await deleteManyFromCloudinary(removedStoryImages);
    }
    revalidatePath(slug === "manifesto" ? "/manifesto" : "/care-guide");
    revalidatePath("/studio/content");
    return { ok: true };
  } catch (err) {
    console.error("[page-content] save failed", err);
    return { ok: false, error: "Could not save. Please try again." };
  }
}
