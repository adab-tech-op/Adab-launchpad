"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireMutator, recordAudit } from "@/lib/roles";
import { LATEST_COUNT_MIN, LATEST_COUNT_MAX } from "@/lib/settings-server";

export type SettingsResult = { ok: true } | { ok: false; error: string };

/** Root/admin only. Sets how many newest products the /latest page shows. */
export async function saveLatestCount(input: unknown): Promise<SettingsResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };

  const parsed = z.coerce
    .number()
    .int()
    .min(LATEST_COUNT_MIN, `Must be at least ${LATEST_COUNT_MIN}.`)
    .max(LATEST_COUNT_MAX, `Must be ${LATEST_COUNT_MAX} or fewer.`)
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid number." };

  try {
    await sql`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES ('latest_count', ${JSON.stringify(parsed.data)}::jsonb, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;
    await recordAudit(actor.email, "settings.update", null, { latest_count: parsed.data });
    revalidatePath("/latest");
    return { ok: true };
  } catch (err) {
    console.error("[settings] saveLatestCount failed", err);
    return { ok: false, error: "Could not save. Make sure db/site-settings.sql has been run." };
  }
}
