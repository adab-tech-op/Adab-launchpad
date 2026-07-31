"use server";

import { z } from "zod";
import { sql } from "@/lib/db";
import type { ActionResult } from "./waitlist";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  orderNumber: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(4000),
});

export async function createContactMessage(input: {
  name: string;
  email: string;
  orderNumber?: string;
  message: string;
}): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { name, email, orderNumber, message } = parsed.data;
  try {
    await sql`
      INSERT INTO contact_messages (name, email, order_number, message)
      VALUES (${name}, ${email}, ${orderNumber || null}, ${message})
    `;
    return { ok: true };
  } catch (err) {
    console.error("[contact] insert failed", err);
    return { ok: false, error: "Couldn't send your message. Please try again or email hello@adab.co." };
  }
}
