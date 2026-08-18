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

export function getManifestoContent(): Promise<ManifestoContent> {
  return readContent("manifesto", MANIFESTO_DEFAULT);
}

export function getCareContent(): Promise<CareContent> {
  return readContent("care", CARE_DEFAULT);
}
