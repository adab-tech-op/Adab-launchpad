import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { sql } from "@/lib/db";
import { getNotifyList } from "@/lib/studio";
import { sendMarketingEmail } from "@/lib/email";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL ?? "").replace(/\/$/, "");
const SECRET = process.env.BETTER_AUTH_SECRET ?? "adab-fallback-secret";

/** Opaque per-email token so unsubscribe links can't be forged or enumerated. */
export function unsubscribeToken(email: string): string {
  return createHmac("sha256", SECRET).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function verifyUnsubscribe(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function unsubscribeUrl(email: string): string {
  return `${SITE_URL}/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;
}

/** Record an unsubscribe. Idempotent. Never throws. */
export async function addUnsubscribe(email: string): Promise<void> {
  try {
    await sql`INSERT INTO marketing_unsubscribes (email) VALUES (${email.trim().toLowerCase()}) ON CONFLICT (email) DO NOTHING`;
  } catch (err) {
    console.error("[broadcast] addUnsubscribe failed", err);
  }
}

/** The notify list minus anyone who has unsubscribed. Deduped, lowercased. */
export async function getBroadcastRecipients(): Promise<string[]> {
  const list = await getNotifyList();
  let suppressed = new Set<string>();
  try {
    const rows = (await sql`SELECT email FROM marketing_unsubscribes`) as { email: string }[];
    suppressed = new Set(rows.map((r) => r.email.trim().toLowerCase()));
  } catch {
    suppressed = new Set();
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of list) {
    const key = c.email.trim().toLowerCase();
    if (!key || suppressed.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(c.email.trim());
  }
  return out;
}

/** Send a broadcast to the whole list, in small batches (Resend rate limits).
 *  Logs the run. Returns counts. Never throws. */
export async function sendBroadcast(
  subject: string,
  html: string,
  actorEmail: string,
): Promise<{ recipientCount: number; sentCount: number }> {
  const recipients = await getBroadcastRecipients();
  let sent = 0;
  const BATCH = 5;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const chunk = recipients.slice(i, i + BATCH);
    const results = await Promise.all(
      chunk.map((email) => sendMarketingEmail({ to: email, subject, html, unsubscribeUrl: unsubscribeUrl(email) })),
    );
    sent += results.filter(Boolean).length;
  }
  try {
    await sql`
      INSERT INTO broadcasts (subject, body_html, recipient_count, sent_count, sent_by)
      VALUES (${subject}, ${html}, ${recipients.length}, ${sent}, ${actorEmail})
    `;
  } catch (err) {
    console.error("[broadcast] log insert failed", err);
  }
  return { recipientCount: recipients.length, sentCount: sent };
}
