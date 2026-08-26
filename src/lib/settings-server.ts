import "server-only";
import { sql } from "@/lib/db";

/** Default count of newest products shown on /latest when the setting or table
 *  is missing (pre-migration). */
export const LATEST_COUNT_DEFAULT = 3;
export const LATEST_COUNT_MIN = 1;
export const LATEST_COUNT_MAX = 50;

/** Reads a single setting value from site_settings. Tolerant: returns null if
 *  the table/row is missing (pre-migration) so callers can fall back. */
async function getSetting(key: string): Promise<unknown> {
  try {
    const rows = (await sql`SELECT value FROM site_settings WHERE key = ${key}`) as { value: unknown }[];
    return rows[0]?.value ?? null;
  } catch {
    return null; // table missing — caller falls back to its default.
  }
}

/** How many newest products /latest should show. Clamped to a sane range;
 *  falls back to the default if unset or out of range. */
export async function getLatestCount(): Promise<number> {
  const raw = await getSetting("latest_count");
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  if (Number.isFinite(n) && n >= LATEST_COUNT_MIN && n <= LATEST_COUNT_MAX) return n;
  return LATEST_COUNT_DEFAULT;
}
