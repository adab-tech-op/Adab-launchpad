import "server-only";
import { sql } from "@/lib/db";
import {
  MANIFESTO_DEFAULT,
  CARE_DEFAULT,
  type ManifestoContent,
  type CareContent,
} from "@/lib/page-content";

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
  const c = await readContent("manifesto", MANIFESTO_DEFAULT);
  // Tolerate rows saved before the hero existed: always merge over the default.
  return { ...c, hero: { ...MANIFESTO_DEFAULT.hero, ...(c.hero ?? {}) } };
}

export function getCareContent(): Promise<CareContent> {
  return readContent("care", CARE_DEFAULT);
}
