"use server";

import { z } from "zod";
import { sql } from "@/lib/db";
import { emailHasRole } from "@/lib/roles";
import { sendWaitlistThankYou } from "@/lib/email";

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

  // Keep studio accounts out of the marketing/notify list — they aren't
  // customers. Silently succeed so the form gives no different signal for an
  // admin email vs a normal one.
  if (await emailHasRole(email)) return { ok: true };

  let isNewSignup = false;
  try {
    const rows = (await sql`
      INSERT INTO waitlist_signups (email, phone, source)
      VALUES (${email}, ${phone || null}, ${source || null})
      ON CONFLICT (lower(email)) DO NOTHING
      RETURNING email
    `) as { email: string }[];
    // A repeat signup hits ON CONFLICT and returns no row, so this is only true
    // the first time an address joins — the guard that stops re-spamming.
    isNewSignup = rows.length > 0;
  } catch (err) {
    console.error("[waitlist] insert failed", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Send the one-time thank-you only on a genuinely new signup. Awaited so the
  // send completes before a serverless function can freeze, but wrapped so an
  // email failure never turns a successful signup into an error for the visitor.
  if (isNewSignup) {
    try {
      await sendWaitlistThankYou({ to: email });
    } catch (err) {
      console.error("[waitlist] thank-you email failed", err);
    }
  }

  return { ok: true };
}
