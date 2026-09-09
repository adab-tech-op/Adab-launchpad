import "server-only";
import { sql } from "@/lib/db";
import {
  MANIFESTO_DEFAULT,
  CARE_DEFAULT,
  HOME_DEFAULT,
  HOME_BODY_DEFAULT,
  DROP_DEFAULT,
  SHOP_DEFAULT,
  CONTACT_DEFAULT,
  type ManifestoContent,
  type CareContent,
  type HomeContent,
  type ShopContent,
  type ContactContent,
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
  const body = { ...HOME_BODY_DEFAULT, ...(c?.body ?? {}) };
  // keep the fixed-length arrays sane
  body.trust = [0, 1, 2].map((i) => body.trust?.[i] ?? HOME_BODY_DEFAULT.trust[i]);
  body.menu = [0, 1, 2].map((i) => body.menu?.[i] ?? HOME_BODY_DEFAULT.menu[i]);
  return {
    ...HOME_DEFAULT,
    ...c,
    hero: hero.desktop ? hero : HOME_DEFAULT.hero,
    overlay: c?.overlay ? normalizeOverlay(c.overlay, undefined) : HOME_DEFAULT.overlay,
    body,
  };
}

export async function getShopContent(): Promise<ShopContent> {
  const c = await readContent<Partial<ShopContent>>("shop", SHOP_DEFAULT);
  return { ...SHOP_DEFAULT, ...c };
}

export async function getContactContent(): Promise<ContactContent> {
  const c = await readContent<Partial<ContactContent>>("contact", CONTACT_DEFAULT);
  return { ...CONTACT_DEFAULT, ...c };
}

export async function getDropContent(): Promise<HomeContent> {
  const c = await readContent<Partial<HomeContent>>("drop", DROP_DEFAULT);
  return {
    ...DROP_DEFAULT,
    ...c,
    hero: normalizeHeroImages(c?.hero, undefined),
    overlay: c?.overlay ? normalizeOverlay(c.overlay, undefined) : DROP_DEFAULT.overlay,
  };
}
