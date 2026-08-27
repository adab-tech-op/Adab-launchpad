import "server-only";
import { sql } from "@/lib/db";
import type { FabricType } from "@/lib/fabrics";

/** All fabric types, ordered. Tolerant: returns [] if the table is missing
 *  (pre-migration) so callers degrade gracefully. */
export async function getFabricTypes(): Promise<FabricType[]> {
  try {
    const rows = (await sql`
      SELECT id, slug, name, care_detail, sort_order
      FROM fabric_types ORDER BY sort_order, name
    `) as FabricType[];
    return rows;
  } catch {
    return [];
  }
}

/** The care text for a product's linked fabric type, or null if unlinked /
 *  missing. Used as the Care Guide source on the PDP. */
export async function getFabricCare(fabricTypeId: number | null | undefined): Promise<string | null> {
  if (!fabricTypeId) return null;
  try {
    const rows = (await sql`SELECT care_detail FROM fabric_types WHERE id = ${fabricTypeId}`) as { care_detail: string }[];
    const care = rows[0]?.care_detail?.trim();
    return care ? care : null;
  } catch {
    return null;
  }
}
