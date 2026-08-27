import "server-only";
import { sql } from "@/lib/db";
import type { ScrapbookImage } from "@/lib/scrapbook";

/** Ordered scrapbook images. Tolerant: [] if the table is missing (pre-migration). */
export async function getScrapbookImages(): Promise<ScrapbookImage[]> {
  try {
    const rows = (await sql`
      SELECT id, image_url, caption, sort_order
      FROM scrapbook_images ORDER BY sort_order, id
    `) as ScrapbookImage[];
    return rows;
  } catch {
    return [];
  }
}
