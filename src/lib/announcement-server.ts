import "server-only";
import { sql } from "@/lib/db";
import { ANNOUNCEMENT_DEFAULTS, type AnnouncementSettings } from "@/lib/announcement";

/** Reads the single announcement row. Direct (uncached) — it's one tiny indexed
 *  read, hit once per page load via /api/announcement, so admin edits show
 *  immediately with no cache to invalidate. Falls back to defaults if the table
 *  is missing (pre-migration). */
export async function getAnnouncementSettings(): Promise<AnnouncementSettings> {
  try {
    const rows = (await sql`
      SELECT enabled, eyebrow, title, body, pages, frequency
      FROM announcement WHERE id = 1
    `) as Partial<AnnouncementSettings>[];
    if (rows[0]) return { ...ANNOUNCEMENT_DEFAULTS, ...rows[0] } as AnnouncementSettings;
  } catch {
    // table missing — defaults.
  }
  return ANNOUNCEMENT_DEFAULTS;
}
