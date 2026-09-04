import "server-only";
import { sql } from "@/lib/db";
import {
  MANIFESTO_DEFAULT,
  CARE_DEFAULT,
  HOME_DEFAULT,
  type ManifestoContent,
  type CareContent,
  type HomeContent,
} from "@/lib/page-content";
import { normalizeHeroImages, normalizeOverlay } from "@/lib/hero";

async function readContent<T>(slug: string, fallback: T): Promise<T> {
  try {
    const rows = (await sql`SELECT content FROM page_content WHERE slug = ${slug}`) as { content: T }[];
    if (rows[0]?.content) return rows[0].content;
  } catch {
    // table missing — defaults.
  }
  return fallback;
}

export async function getManifestoContent(): Promise<ManifestoContent> {
  const c = await readContent<ManifestoContent & { hero?: Record<string, unknown> }>("manifesto", MANIFESTO_DEFAULT);
  const rawHero = (c.hero ?? {}) as { image?: string; images?: unknown; overlay?: unknown; scrim?: number };
  // Tolerate rows saved before the 3-breakpoint images / before the overlay:
  // merge over the default and normalize (legacy single `image`, legacy `scrim`).
  return {
    ...c,
    hero: {
      ...MANIFESTO_DEFAULT.hero,
      ...rawHero,
      images: normalizeHeroImages(rawHero.images, rawHero.image),
      overlay: normalizeOverlay(rawHero.overlay, rawHero.scrim),
    },
  };
}

export function getCareContent(): Promise<CareContent> {
  return readContent("care", CARE_DEFAULT);
}

export async function getHomeContent(): Promise<HomeContent> {
  const c = await readContent<Partial<HomeContent>>("home", HOME_DEFAULT);
  const hero = normalizeHeroImages(c?.hero, undefined);
  return {
    ...HOME_DEFAULT,
    ...c,
    hero: hero.desktop ? hero : HOME_DEFAULT.hero,
    overlay: c?.overlay ? normalizeOverlay(c.overlay, undefined) : HOME_DEFAULT.overlay,
  };
}
