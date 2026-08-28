"use server";

import { z } from "zod";
import { requireMutator, recordAudit } from "@/lib/roles";
import { sendBroadcast, unsubscribeUrl } from "@/lib/broadcast-server";
import { sendMarketingEmail } from "@/lib/email";

export type BroadcastResult =
  | { ok: true; recipientCount: number; sentCount: number }
  | { ok: false; error: string };

const schema = z.object({
  subject: z.string().trim().min(3, "Add a subject.").max(200),
  html: z.string().trim().min(10, "Write a message body."),
});

/** Send a test copy to one address (the admin's own) before the real send. */
export async function testBroadcast(input: unknown, to: string): Promise<BroadcastResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the fields." };
  const target = (to || actor.email).trim();
  const ok = await sendMarketingEmail({
    to: target,
    subject: `[TEST] ${p.data.subject}`,
    html: p.data.html,
    unsubscribeUrl: unsubscribeUrl(target),
  });
  if (!ok) return { ok: false, error: "Send failed — check RESEND_API_KEY is set." };
  return { ok: true, recipientCount: 1, sentCount: 1 };
}

/** Send the broadcast to the full (non-unsubscribed) list. */
export async function sendBroadcastToList(input: unknown): Promise<BroadcastResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the fields." };
  const { recipientCount, sentCount } = await sendBroadcast(p.data.subject, p.data.html, actor.email);
  await recordAudit(actor.email, "broadcast.send", `${sentCount}/${recipientCount}: ${p.data.subject}`);
  return { ok: true, recipientCount, sentCount };
}
