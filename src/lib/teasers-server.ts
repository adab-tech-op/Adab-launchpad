import "server-only";
import { sql } from "@/lib/db";
import type { Teaser } from "@/lib/teasers";

type Row = { id: number; label: string; subtext: string; image_url: string; sort_order: number; active: boolean };
const toTeaser = (r: Row): Teaser => ({
  id: r.id, label: r.label, subtext: r.subtext, imageUrl: r.image_url, sortOrder: r.sort_order, active: r.active,
});

export async function getActiveTeasers(): Promise<Teaser[]> {
  try {
    const rows = (await sql`SELECT * FROM teasers WHERE active = true ORDER BY sort_order, id`) as Row[];
    return rows.map(toTeaser);
  } catch {
    return []; // table missing → no teasers
  }
}

export async function getAllTeasers(): Promise<Teaser[]> {
  try {
    const rows = (await sql`SELECT * FROM teasers ORDER BY sort_order, id`) as Row[];
    return rows.map(toTeaser);
  } catch {
    return [];
  }
}
