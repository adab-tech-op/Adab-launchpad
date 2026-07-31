"use server";

import { z } from "zod";
import { sql } from "@/lib/db";

const schema = z.object({
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  source: z.string().trim().max(60).optional().or(z.literal("")),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createWaitlistSignup(input: {
  email: string;
  phone?: string;
  source?: string;
}): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email, phone, source } = parsed.data;
  try {
    await sql`
      INSERT INTO waitlist_signups (email, phone, source)
      VALUES (${email}, ${phone || null}, ${source || null})
      ON CONFLICT (lower(email)) DO NOTHING
    `;
    return { ok: true };
  } catch (err) {
    console.error("[waitlist] insert failed", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
