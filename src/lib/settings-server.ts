import "server-only";
import { sql } from "@/lib/db";
import {
  BANNER_DEFAULT,
  type BannerSettings,
  SIZE_GUIDE_DEFAULT,
  type SizeGuideSettings,
  HANDOVER_GUIDE_DEFAULT,
  type HandoverGuideSettings,
} from "@/lib/settings";

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

/** Reads the editable top banner (shown on Shop + Latest). Merges over defaults
 *  so a missing key/table (pre-save) keeps the original look. Tolerant of a bad
 *  stored shape. */
export async function getBanner(): Promise<BannerSettings> {
  const raw = await getSetting("banner");
  if (raw && typeof raw === "object") {
    return { ...BANNER_DEFAULT, ...(raw as Partial<BannerSettings>) };
  }
  return BANNER_DEFAULT;
}

/** Reads the editable Size Guide (Fit & Sizing popup). Merges over the default
 *  so a missing key/table (pre-save) keeps the original look. */
export async function getSizeGuide(): Promise<SizeGuideSettings> {
  const raw = await getSetting("size_guide");
  if (raw && typeof raw === "object") {
    return { ...SIZE_GUIDE_DEFAULT, ...(raw as Partial<SizeGuideSettings>) };
  }
  return SIZE_GUIDE_DEFAULT;
}

/** Reads the editable Product Handover Guide (Delivery & Returns popup). */
export async function getHandoverGuide(): Promise<HandoverGuideSettings> {
  const raw = await getSetting("handover_guide");
  if (raw && typeof raw === "object") {
    return { ...HANDOVER_GUIDE_DEFAULT, ...(raw as Partial<HandoverGuideSettings>) };
  }
  return HANDOVER_GUIDE_DEFAULT;
}

/** Whether customers may order multiple products/sizes in one order. Default
 *  false (one piece per order); flipped on for occasional offers. */
export async function getAllowMultiOrder(): Promise<boolean> {
  return (await getSetting("allow_multi_order")) === true;
}

/** Days before a product's drop_date that it flips from hidden to "upcoming".
 *  Admin-set; clamped 1–60; default 7. */
export async function getDropWindowDays(): Promise<number> {
  const raw = await getSetting("drop_window_days");
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  if (Number.isFinite(n) && n >= 1 && n <= 60) return n;
  return 7;
}
