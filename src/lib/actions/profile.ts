"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { currentUserId } from "@/lib/auth-guard";

const schema = z.object({
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  default_size: z.enum(["", "S", "M", "L", "XL", "XXL"]).optional(),
  address_line: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  area: z.string().trim().max(120).optional().or(z.literal("")),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
});

export type ProfileResult = { ok: true } | { ok: false; error: string };

export async function saveProfile(input: {
  phone?: string;
  default_size?: string;
  address_line?: string;
  city?: string;
  area?: string;
  postal_code?: string;
}): Promise<ProfileResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form." };
  const d = parsed.data;
  try {
    await sql`
      INSERT INTO profiles (user_id, phone, default_size, address_line, city, area, postal_code, updated_at)
      VALUES (${userId}, ${d.phone || null}, ${d.default_size || null}, ${d.address_line || null},
              ${d.city || null}, ${d.area || null}, ${d.postal_code || null}, now())
      ON CONFLICT (user_id) DO UPDATE SET
        phone = EXCLUDED.phone,
        default_size = EXCLUDED.default_size,
        address_line = EXCLUDED.address_line,
        city = EXCLUDED.city,
        area = EXCLUDED.area,
        postal_code = EXCLUDED.postal_code,
        updated_at = now()
    `;
    revalidatePath("/account/profile");
    revalidatePath("/account");
    return { ok: true };
  } catch (err) {
    console.error("[profile] save failed", err);
    return { ok: false, error: "Could not save. Please try again." };
  }
}
