"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireMutator, recordAudit } from "@/lib/roles";
import { deleteManyFromCloudinary } from "@/lib/cloudinary-server";
import { heroImageUrls, type HeroImages } from "@/lib/hero";

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

const focalSchema = z.object({
  x: z.coerce.number().min(0).max(100).default(50),
  y: z.coerce.number().min(0).max(100).default(50),
  zoom: z.coerce.number().min(1).max(3).default(1),
});

// 3-breakpoint hero images + per-fallback focal point. Declared explicitly so
// zod keeps every key (it strips unknowns otherwise).
const heroImagesSchema = z.object({
  desktop: z.string().trim().max(600).default(""),
  tablet: z.string().trim().max(600).default(""),
  phone: z.string().trim().max(600).default(""),
  focalTablet: focalSchema.default({ x: 50, y: 50, zoom: 1 }),
  focalPhone: focalSchema.default({ x: 50, y: 50, zoom: 1 }),
});

// Each page has a known shape; validate against it before storing.
const shapes = {
  manifesto: z.object({
    hero: z.object({
      images: heroImagesSchema,
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
  home: z.object({
    hero: heroImagesSchema,
  }),
} as const;

type Slug = keyof typeof shapes;

const PATH_FOR_SLUG: Record<Slug, string> = {
  manifesto: "/manifesto",
  care: "/care-guide",
  home: "/",
};

// URLs referenced by a stored hero, tolerating the legacy single `image` string.
function storedHeroUrls(hero: unknown): string[] {
  if (!hero || typeof hero !== "object") return [];
  const h = hero as { image?: string; images?: HeroImages };
  const urls: string[] = [];
  if (typeof h.image === "string" && h.image) urls.push(h.image);
  urls.push(...heroImageUrls(h.images));
  return urls;
}

/** Root/admin only. Saves the editable blocks for a page. */
export async function savePageContent(slug: string, content: unknown): Promise<PageContentResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };

  const shape = shapes[slug as Slug];
  if (!shape) return { ok: false, error: "Unknown page." };

  const parsed = shape.safeParse(content);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the content." };

  // Collect the previous image URLs (hero across all breakpoints + story parts)
  // so replaced/removed Cloudinary assets can be cleaned up after the write.
  let oldImages: string[] = [];
  try {
    const rows = (await sql`SELECT content FROM page_content WHERE slug = ${slug}`) as {
      content: { hero?: unknown; storyParts?: { image?: string }[] };
    }[];
    const prev = rows[0]?.content;
    if (prev) {
      oldImages = [
        ...storedHeroUrls(prev.hero),
        ...(prev.storyParts ?? []).map((p) => p?.image).filter((u): u is string => !!u),
      ];
    }
  } catch {
    oldImages = [];
  }

  try {
    await sql`
      INSERT INTO page_content (slug, content, updated_at)
      VALUES (${slug}, ${JSON.stringify(parsed.data)}::jsonb, now())
      ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, updated_at = now()
    `;
    await recordAudit(actor.email, "content.update", slug);

    // Best-effort cleanup of any image no longer referenced.
    if (oldImages.length) {
      const data = parsed.data as { hero?: { images?: HeroImages }; storyParts?: { image?: string }[] };
      const newImages = new Set<string>([
        ...heroImageUrls(data.hero?.images),
        ...(data.storyParts ?? []).map((p) => p?.image).filter((u): u is string => !!u),
      ]);
      const removed = oldImages.filter((u) => !newImages.has(u));
      if (removed.length) await deleteManyFromCloudinary(removed);
    }

    revalidatePath(PATH_FOR_SLUG[slug as Slug]);
    revalidatePath("/studio/content");
    return { ok: true };
  } catch (err) {
    console.error("[page-content] save failed", err);
    return { ok: false, error: "Could not save. Please try again." };
  }
}
