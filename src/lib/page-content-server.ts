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
import { normalizeHeroImages } from "@/lib/hero";

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
  const c = await readContent<ManifestoContent & { hero?: { image?: string } }>("manifesto", MANIFESTO_DEFAULT);
  const rawHero = (c.hero ?? {}) as { image?: string; images?: unknown };
  // Tolerate rows saved before the hero / before the 3-breakpoint images:
  // merge over the default and normalize images (legacy single `image`).
  return {
    ...c,
    hero: {
      ...MANIFESTO_DEFAULT.hero,
      ...rawHero,
      images: normalizeHeroImages(rawHero.images, rawHero.image),
    },
  };
}

export function getCareContent(): Promise<CareContent> {
  return readContent("care", CARE_DEFAULT);
}

export async function getHomeContent(): Promise<HomeContent> {
  const c = await readContent<Partial<HomeContent>>("home", HOME_DEFAULT);
  const hero = normalizeHeroImages(c?.hero, undefined);
  return { hero: hero.desktop ? hero : HOME_DEFAULT.hero };
}
