import "server-only";
import { sql } from "@/lib/db";
import { getProductMap } from "@/lib/products";
import { axesFromLegacy, type OrderAxes, type PaymentStatus, type DeliveryStatus } from "@/lib/order-status";

function priceToNumber(price?: string): number {
  if (!price) return 0;
  return Number(price.replace(/[^0-9]/g, "")) || 0;
}

export type OrderFollowUp = { template: string; subject: string | null; sentAt: string; sentBy: string | null };

export type AdminOrder = {
  orderRef: string;
  name: string;
  email: string;
  phone: string;
  deliveryAddress: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  items: { name: string; size: string; quantity: number; price: string }[];
  total: number;
  payment: { bkashNumber: string; trxId: string; amount: number | null; submittedAt: string } | null;
  // Two-axis state (derived from legacy status until an order_state row exists).
  axes: OrderAxes;
  confirmationSentAt: string | null;
  confirmedBy: string | null;
  followUps: OrderFollowUp[];
};

export async function getAllOrders(): Promise<AdminOrder[]> {
  const rows = (await sql`
    SELECT order_ref, name, email, phone, product_slug, size, quantity,
           delivery_address, notes, status, created_at
    FROM reservations
    ORDER BY created_at DESC
  `) as {
    order_ref: string | null;
    name: string;
    email: string;
    phone: string;
    product_slug: string;
    size: string;
    quantity: number;
    delivery_address: string | null;
    notes: string | null;
    status: string;
    created_at: string;
  }[];

  const productMap = await getProductMap();
  const map = new Map<string, AdminOrder>();
  for (const r of rows) {
    const key = r.order_ref ?? `no-ref-${r.email}-${r.created_at}`;
    if (!map.has(key)) {
      map.set(key, {
        orderRef: r.order_ref ?? "—",
        name: r.name,
        email: r.email,
        phone: r.phone,
        deliveryAddress: r.delivery_address,
        notes: r.notes,
        status: r.status,
        createdAt: r.created_at,
        items: [],
        total: 0,
        payment: null,
        axes: axesFromLegacy(r.status), // overwritten below if an order_state row exists
        confirmationSentAt: null,
        confirmedBy: null,
        followUps: [],
      });
    }
    const o = map.get(key)!;
    const p = productMap.get(r.product_slug);
    const price = p?.price ?? "";
    o.items.push({ name: p?.name ?? r.product_slug, size: r.size, quantity: r.quantity, price });
    o.total += priceToNumber(price) * r.quantity;
  }

  // Attach payment submissions.
  try {
    const pays = (await sql`
      SELECT order_ref, bkash_number, trx_id, amount, submitted_at FROM payments
    `) as { order_ref: string; bkash_number: string; trx_id: string; amount: number | null; submitted_at: string }[];
    for (const pay of pays) {
      const o = map.get(pay.order_ref);
      if (o) {
        o.payment = {
          bkashNumber: pay.bkash_number,
          trxId: pay.trx_id,
          amount: pay.amount,
          submittedAt: pay.submitted_at,
        };
      }
    }
  } catch (err) {
    console.error("[studio] payments fetch failed", err);
  }

  // Attach two-axis order state (source of truth; overrides derived axes).
  try {
    const states = (await sql`
      SELECT order_ref, payment_status, delivery_status, cancelled, confirmation_sent_at, confirmed_by
      FROM order_state
    `) as {
      order_ref: string;
      payment_status: PaymentStatus;
      delivery_status: DeliveryStatus;
      cancelled: boolean;
      confirmation_sent_at: string | null;
      confirmed_by: string | null;
    }[];
    for (const s of states) {
      const o = map.get(s.order_ref);
      if (o) {
        o.axes = { payment: s.payment_status, delivery: s.delivery_status, cancelled: s.cancelled };
        o.confirmationSentAt = s.confirmation_sent_at;
        o.confirmedBy = s.confirmed_by;
      }
    }
  } catch (err) {
    // order_state missing (pre-migration): derived axes from status still stand.
    console.error("[studio] order_state fetch skipped/failed", err);
  }

  // Attach follow-up send history.
  try {
    const fus = (await sql`
      SELECT order_ref, template, subject, sent_at, sent_by FROM follow_ups ORDER BY sent_at DESC
    `) as { order_ref: string; template: string; subject: string | null; sent_at: string; sent_by: string | null }[];
    for (const f of fus) {
      const o = map.get(f.order_ref);
      if (o) o.followUps.push({ template: f.template, subject: f.subject, sentAt: f.sent_at, sentBy: f.sent_by });
    }
  } catch (err) {
    console.error("[studio] follow_ups fetch skipped/failed", err);
  }

  return [...map.values()];
}

export type StudioStats = {
  orders: number;
  toVerify: number;
  waitlist: number;
  messages: number;
};

export async function getStudioStats(): Promise<StudioStats> {
  const [orders, toVerify, waitlist, messages] = await Promise.all([
    sql`SELECT COUNT(DISTINCT order_ref)::int AS c FROM reservations`,
    sql`SELECT COUNT(DISTINCT order_ref)::int AS c FROM reservations WHERE status = 'payment_submitted'`,
    sql`SELECT COUNT(*)::int AS c FROM waitlist_signups`,
    sql`SELECT COUNT(*)::int AS c FROM contact_messages`,
  ]);
  return {
    orders: (orders as { c: number }[])[0]?.c ?? 0,
    toVerify: (toVerify as { c: number }[])[0]?.c ?? 0,
    waitlist: (waitlist as { c: number }[])[0]?.c ?? 0,
    messages: (messages as { c: number }[])[0]?.c ?? 0,
  };
}

export async function getWaitlist() {
  return (await sql`
    SELECT email, phone, source, created_at FROM waitlist_signups ORDER BY created_at DESC LIMIT 500
  `) as { email: string; phone: string | null; source: string | null; created_at: string }[];
}

export async function getContactMessages() {
  return (await sql`
    SELECT name, email, order_number, message, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 500
  `) as { name: string; email: string; order_number: string | null; message: string; created_at: string }[];
}

export type NotifyContact = { email: string; name: string | null; source: string; addedAt: string };

/** The consented marketing list: newsletter signups UNION buyers who ticked the
 *  consent box at /pay, minus anyone who unsubscribed. Email is the key; each
 *  address appears once (most recent wins). Degrades gracefully pre-migration. */
export async function getNotifyList(): Promise<NotifyContact[]> {
  const byEmail = new Map<string, NotifyContact>();

  // Newsletter / waitlist signups.
  try {
    const rows = (await sql`
      SELECT email, source, created_at FROM waitlist_signups ORDER BY created_at DESC
    `) as { email: string; source: string | null; created_at: string }[];
    for (const r of rows) {
      const key = r.email.toLowerCase();
      if (!byEmail.has(key)) byEmail.set(key, { email: r.email, name: null, source: r.source ?? "newsletter", addedAt: r.created_at });
    }
  } catch (err) {
    console.error("[studio] notify: waitlist fetch failed", err);
  }

  // Consented buyers.
  try {
    const rows = (await sql`
      SELECT DISTINCT ON (lower(email)) email, name, created_at
      FROM reservations
      WHERE marketing_consent = true
      ORDER BY lower(email), created_at DESC
    `) as { email: string; name: string; created_at: string }[];
    for (const r of rows) {
      const key = r.email.toLowerCase();
      const existing = byEmail.get(key);
      if (existing) {
        existing.name = existing.name ?? r.name;
        existing.source = "newsletter + purchase";
      } else {
        byEmail.set(key, { email: r.email, name: r.name, source: "purchase", addedAt: r.created_at });
      }
    }
  } catch (err) {
    // marketing_consent column missing pre-migration — waitlist-only is fine.
    console.error("[studio] notify: consented buyers fetch skipped/failed", err);
  }

  // Remove unsubscribes.
  try {
    const unsubs = (await sql`SELECT email FROM marketing_unsubscribes`) as { email: string }[];
    for (const u of unsubs) byEmail.delete(u.email.toLowerCase());
  } catch (err) {
    console.error("[studio] notify: unsubscribes fetch skipped/failed", err);
  }

  return [...byEmail.values()].sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
}
