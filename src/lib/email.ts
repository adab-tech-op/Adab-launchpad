import "server-only";
import { Resend } from "resend";
import { getProductMap, type Product } from "@/lib/products";

// Resend is configured lazily. If RESEND_API_KEY is unset, sends are skipped
// (logged) so the app works before email is wired up.
let _resend: Resend | null = null;
function client(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.ADAB_FROM_EMAIL ?? "ADAB <info@adab.world>";
const NOTIFY = process.env.ADAB_NOTIFY_EMAIL; // internal ops inbox (optional)

const INK = "#1c1c1c";
const PRUSSIAN = "#003153";
const PAPER = "#faf6ef";
const MUTED = "#8a8a8a";
const BORDER = "#d9d2c4";

export type OrderItem = { product_slug: string; size: string; quantity: number };


const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL ?? "").replace(/\/$/, "");

// The ADAB wordmark for emails. Resolves to the custom domain (SITE_URL) or an
// explicit ADAB_LOGO_URL — never the Vercel deployment URL. SVG isn't reliable in
// email clients, so this points at a rasterized PNG in /public/assets.
const LOGO_URL = process.env.ADAB_LOGO_URL ?? (SITE_URL ? `${SITE_URL}/assets/adab-email-logo.png` : "");

/** The brand mark for an email header: the logo image when a URL is available,
 *  otherwise a text fallback so the header is never empty. */
function brandMark(): string {
  return LOGO_URL
    ? `<img src="${LOGO_URL}" alt="ADAB" width="66" height="30" style="display:block;height:30px;width:auto;border:0;outline:none;text-decoration:none;margin:0 0 10px;">`
    : `<span style="display:block;font-weight:700;letter-spacing:0.14em;color:${PRUSSIAN};font-size:18px;margin:0 0 10px;">ADAB</span>`;
}

/** Link to prefilled signup so buying can complete into an account. */
function secureAccountUrl(o: { to: string; orderRef: string }): string {
  const qs = new URLSearchParams({ email: o.to, ref: o.orderRef });
  return `${SITE_URL}/signup?${qs.toString()}`;
}

function itemRows(items: OrderItem[], productMap: Map<string, Product>): string {
  return items
    .map((it) => {
      const p = productMap.get(it.product_slug);
      const name = p?.name ?? it.product_slug;
      const price = p?.price ?? "";
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BORDER};color:${INK};font-size:14px;">
            ${name}<br><span style="color:${MUTED};font-size:12px;">Size ${it.size} &middot; Qty ${it.quantity}</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid ${BORDER};color:${INK};font-size:14px;text-align:right;white-space:nowrap;">${price}</td>
        </tr>`;
    })
    .join("");
}


function authEmailHtml(opts: { heading: string; body: string; cta: string; url: string }): string {
  return `
  <div style="background:${PAPER};padding:32px 0;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
      <tr><td style="padding:28px 32px 8px;">
        ${brandMark()}
        <h1 style="margin:12px 0 0;font-size:22px;color:${INK};font-weight:600;">${opts.heading}</h1>
        <p style="margin:12px 0 0;color:${INK};font-size:15px;line-height:1.6;">${opts.body}</p>
      </td></tr>
      <tr><td style="padding:24px 32px 8px;">
        <a href="${opts.url}" style="display:inline-block;background:${PRUSSIAN};color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;padding:13px 26px;border-radius:999px;">${opts.cta}</a>
      </td></tr>
      <tr><td style="padding:16px 32px 28px;">
        <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.7;">If the button doesn't work, copy this link:<br><span style="color:${PRUSSIAN};word-break:break-all;">${opts.url}</span></p>
      </td></tr>
      <tr><td style="padding:16px 32px;background:${PAPER};border-top:1px solid ${BORDER};">
        <p style="margin:0;color:${MUTED};font-size:12px;">ADAB &middot; Old Soul. New Cut. &middot; Dhaka, Bangladesh</p>
      </td></tr>
    </table>
  </div>`;
}

export async function sendVerificationEmail(opts: { to: string; url: string; name?: string }): Promise<void> {
  const resend = client();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — verification link for ${opts.to}: ${opts.url}`);
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: "Verify your email — ADAB",
      html: authEmailHtml({
        heading: `Welcome${opts.name ? `, ${opts.name}` : ""}.`,
        body: "Confirm your email to activate your ADAB account.",
        cta: "Verify email",
        url: opts.url,
      }),
    });
  } catch (err) {
    console.error(`[email] verification email failed for ${opts.to}`, err);
  }
}

export async function sendPasswordResetEmail(opts: { to: string; url: string; name?: string }): Promise<void> {
  const resend = client();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — reset link for ${opts.to}: ${opts.url}`);
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: "Reset your password — ADAB",
      html: authEmailHtml({
        heading: "Reset your password.",
        body: "We received a request to reset your ADAB password. This link expires shortly. If you didn't ask for this, you can ignore this email.",
        cta: "Reset password",
        url: opts.url,
      }),
    });
  } catch (err) {
    console.error(`[email] reset email failed for ${opts.to}`, err);
  }
}

export type PaymentEmailInput = {
  to: string;
  name: string;
  phone: string;
  orderRef: string;
  items: OrderItem[];
  amount: number;
  bkashNumber: string;
  trxId: string;
  /** True when this email has no account yet — show the "set a password" CTA.
   *  Moved here from the (now removed) reservation email: payment submission is
   *  the first and only automatic customer email in the drop flow. */
  canCreateAccount?: boolean;
};

export async function sendPaymentReceived(o: PaymentEmailInput): Promise<void> {
  const resend = client();
  const productMap = await getProductMap();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping payment email for ${o.orderRef}`);
    return;
  }
  // Name the piece(s) in the copy, so the email is clearly about a specific order.
  const itemNames = o.items.map((i) => productMap.get(i.product_slug)?.name ?? i.product_slug);
  const productLabel =
    itemNames.length === 1 ? itemNames[0] : `your ${itemNames.length} pieces`;
  const customer = `
  <div style="background:${PAPER};padding:32px 0;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
      <tr><td style="padding:28px 32px 8px;">
        ${brandMark()}<p style="margin:0;letter-spacing:0.22em;text-transform:uppercase;font-size:11px;color:${PRUSSIAN};">Founding Drop</p>
        <h1 style="margin:12px 0 0;font-size:24px;color:${INK};font-weight:600;">Payment details received.</h1>
        <p style="margin:12px 0 0;color:${INK};font-size:15px;line-height:1.6;">Thank you, ${o.name}. You&rsquo;ve submitted your payment details for <strong>${productLabel}</strong> (order ${o.orderRef}). We&rsquo;ll verify them against bKash and message you on WhatsApp within 24 hours. Nothing is confirmed until we do &mdash; this isn&rsquo;t a confirmed order yet.</p>
      </td></tr>
      <tr><td style="padding:18px 32px 0;">
        <table role="presentation" width="100%"><tr>
          <td style="color:${MUTED};font-size:13px;">TrxID</td>
          <td style="text-align:right;color:${INK};font-size:13px;">${o.trxId}</td>
        </tr><tr>
          <td style="color:${MUTED};font-size:13px;">Amount</td>
          <td style="text-align:right;color:${INK};font-size:13px;">৳ ${o.amount.toLocaleString()}</td>
        </tr></table>
      </td></tr>
      ${
        o.canCreateAccount && SITE_URL
          ? `<tr><td style="padding:8px 32px 4px;">
        <div style="border:1px solid ${BORDER};border-radius:12px;padding:18px 20px;background:${PAPER};">
          <p style="margin:0;color:${INK};font-size:14px;font-weight:600;">Track this order.</p>
          <p style="margin:6px 0 14px;color:${MUTED};font-size:13px;line-height:1.6;">Set a password to follow this order's status and check out faster next time. Optional.</p>
          <a href="${secureAccountUrl({ to: o.to, orderRef: o.orderRef })}" style="display:inline-block;background:${PRUSSIAN};color:#ffffff;text-decoration:none;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;padding:11px 22px;border-radius:999px;">Set a password</a>
        </div>
      </td></tr>`
          : ""
      }
      <tr><td style="padding:16px 32px 28px;">
        <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.7;">This confirms we received your submission, not that payment is verified yet. Made in Bangladesh.</p>
      </td></tr>
      <tr><td style="padding:16px 32px;background:${PAPER};border-top:1px solid ${BORDER};">
        <p style="margin:0;color:${MUTED};font-size:12px;">ADAB &middot; Old Soul. New Cut. &middot; Dhaka, Bangladesh</p>
      </td></tr>
    </table>
  </div>`;

  try {
    await resend.emails.send({
      from: FROM,
      to: o.to,
      subject: `Payment received — ${o.orderRef}`,
      html: customer,
    });
  } catch (err) {
    console.error(`[email] payment-received (customer) failed for ${o.orderRef}`, err);
  }

  if (NOTIFY) {
    const team = `
    <div style="font-family:Helvetica,Arial,sans-serif;color:${INK};">
      <h2 style="font-size:18px;">Payment to verify — ${o.orderRef}</h2>
      <table role="presentation" width="100%" style="max-width:520px;font-size:14px;">
        <tr><td style="color:${MUTED};">Expected amount</td><td style="text-align:right;"><strong>৳ ${o.amount.toLocaleString()}</strong></td></tr>
        <tr><td style="color:${MUTED};">Paid from (bKash)</td><td style="text-align:right;">${o.bkashNumber}</td></tr>
        <tr><td style="color:${MUTED};">TrxID</td><td style="text-align:right;"><strong>${o.trxId}</strong></td></tr>
        <tr><td style="color:${MUTED};">Customer</td><td style="text-align:right;">${o.name} · ${o.phone}</td></tr>
      </table>
      ${itemRows(o.items, productMap)}
      <p style="font-size:13px;color:${MUTED};">Verify against your bKash statement, then set status in /studio.</p>
    </div>`;
    try {
      await resend.emails.send({
        from: FROM,
        to: NOTIFY,
        subject: `Verify payment ${o.orderRef} — ৳${o.amount.toLocaleString()} · ${o.trxId}`,
        html: team,
      });
    } catch (err) {
      console.error(`[email] payment-received (team) failed for ${o.orderRef}`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// Manual, admin-triggered emails. Unlike the transactional helpers above, these
// RETURN success/failure instead of swallowing it — the caller (a guarded,
// once-only admin action) must know whether the send actually left, so a failed
// send stays retryable and never burns the one-shot.
// ---------------------------------------------------------------------------

export type SendResult = { ok: true } | { ok: false; error: string };

export type PaymentConfirmedInput = {
  to: string;
  name: string;
  orderRef: string;
  items: OrderItem[];
  amount: number;
};

/** The real "your payment is confirmed" email. Sent once, only after an admin
 *  has verified the bKash payment and attested to it. Returns a result. */
export async function sendPaymentConfirmed(o: PaymentConfirmedInput): Promise<SendResult> {
  const resend = client();
  if (!resend) return { ok: false, error: "Email is not configured (RESEND_API_KEY missing)." };
  const productMap = await getProductMap();

  const html = `
  <div style="background:${PAPER};padding:32px 0;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
      <tr><td style="padding:28px 32px 8px;">
        ${brandMark()}<p style="margin:0;letter-spacing:0.22em;text-transform:uppercase;font-size:11px;color:${PRUSSIAN};">Founding Drop</p>
        <h1 style="margin:12px 0 0;font-size:24px;color:${INK};font-weight:600;">Payment confirmed.</h1>
        <p style="margin:12px 0 0;color:${INK};font-size:15px;line-height:1.6;">Thank you, ${o.name}. We've verified your payment for <strong>${o.orderRef}</strong> — your order is confirmed. We'll be in touch about delivery.</p>
      </td></tr>
      <tr><td style="padding:20px 32px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows(o.items, productMap)}</table>
        <p style="margin:12px 0 0;display:flex;justify-content:space-between;color:${INK};font-size:14px;border-top:1px solid ${BORDER};padding-top:10px;">
          <span style="color:${MUTED};">Total paid</span><span>৳ ${o.amount.toLocaleString()}</span>
        </p>
      </td></tr>
      <tr><td style="padding:16px 32px 28px;">
        <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.7;">This is your confirmation of a verified payment. Made in Bangladesh.</p>
      </td></tr>
      <tr><td style="padding:16px 32px;background:${PAPER};border-top:1px solid ${BORDER};">
        <p style="margin:0;color:${MUTED};font-size:12px;">ADAB &middot; Old Soul. New Cut. &middot; Dhaka, Bangladesh</p>
      </td></tr>
    </table>
  </div>`;

  try {
    const res = await resend.emails.send({
      from: FROM,
      to: o.to,
      subject: `Payment confirmed — ${o.orderRef}`,
      html,
    });
    if (res.error) return { ok: false, error: res.error.message ?? "Send failed." };
    return { ok: true };
  } catch (err) {
    const msg = String((err as { message?: string })?.message ?? err);
    console.error(`[email] payment-confirmed failed for ${o.orderRef}`, err);
    return { ok: false, error: msg };
  }
}

export type FollowUpTemplate = "shipped" | "thank_you" | "custom";

export type FollowUpInput = {
  to: string;
  name: string;
  orderRef: string;
  template: FollowUpTemplate;
  /** For 'custom': the admin-authored body. Plain text; rendered into the shell. */
  customBody?: string;
  customSubject?: string;
};

const FOLLOW_UP_COPY: Record<Exclude<FollowUpTemplate, "custom">, { subject: string; heading: string; body: string }> = {
  shipped: {
    subject: "Your ADAB order is on its way",
    heading: "On its way.",
    body: "Your pieces have shipped. We'll share tracking or a delivery window over WhatsApp shortly. Thank you for your patience.",
  },
  thank_you: {
    subject: "Thank you, from ADAB",
    heading: "Thank you.",
    body: "Thank you for being one of our founding customers. It means a great deal to a young house like ours. We hope your piece wears in beautifully — and we'd love to see it on you.",
  },
};

/** A manual, repeatable per-order follow-up. Returns a result and the resolved
 *  subject so the caller can log what was sent. */
export async function sendFollowUp(o: FollowUpInput): Promise<SendResult & { subject?: string }> {
  const resend = client();
  if (!resend) return { ok: false, error: "Email is not configured (RESEND_API_KEY missing)." };

  let subject: string;
  let heading: string;
  let body: string;
  if (o.template === "custom") {
    subject = (o.customSubject ?? "A note from ADAB").trim();
    heading = "A note from ADAB.";
    body = (o.customBody ?? "").trim();
    if (!body) return { ok: false, error: "Custom message body is empty." };
  } else {
    ({ subject, heading, body } = FOLLOW_UP_COPY[o.template]);
  }

  const html = `
  <div style="background:${PAPER};padding:32px 0;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
      <tr><td style="padding:28px 32px 8px;">
        ${brandMark()}<p style="margin:0;letter-spacing:0.22em;text-transform:uppercase;font-size:11px;color:${PRUSSIAN};">${o.orderRef}</p>
        <h1 style="margin:12px 0 0;font-size:22px;color:${INK};font-weight:600;">${heading}</h1>
        <p style="margin:12px 0 0;color:${INK};font-size:15px;line-height:1.6;white-space:pre-line;">${body.replace(/\{name\}/g, o.name)}</p>
      </td></tr>
      <tr><td style="padding:20px 32px 28px;">
        <p style="margin:0;color:${MUTED};font-size:12px;">ADAB &middot; Old Soul. New Cut. &middot; Dhaka, Bangladesh</p>
      </td></tr>
    </table>
  </div>`;

  try {
    const res = await resend.emails.send({ from: FROM, to: o.to, subject, html });
    if (res.error) return { ok: false, error: res.error.message ?? "Send failed." };
    return { ok: true, subject };
  } catch (err) {
    const msg = String((err as { message?: string })?.message ?? err);
    console.error(`[email] follow-up failed for ${o.orderRef}`, err);
    return { ok: false, error: msg };
  }
}

export async function sendAdminInvite(opts: {
  to: string;
  role: string;
  invitedBy: string;
  url: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { ok: false, error: "Email is not configured (RESEND_API_KEY missing)." };
  const roleLabel = opts.role.charAt(0).toUpperCase() + opts.role.slice(1);
  try {
    const res = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: "You've been invited to ADAB Studio",
      html: authEmailHtml({
        heading: "You're invited.",
        body: `${opts.invitedBy} has invited you to ADAB Studio as <strong>${roleLabel}</strong>. Sign in (or create an account) with this email address, then accept to activate your access. This invitation expires in 72 hours.`,
        cta: "Accept invitation",
        url: opts.url,
      }),
    });
    if (res.error) return { ok: false, error: res.error.message ?? "Send failed." };
    return { ok: true };
  } catch (err) {
    const msg = String((err as { message?: string })?.message ?? err);
    console.error(`[email] admin invite failed for ${opts.to}`, err);
    return { ok: false, error: msg };
  }
}
