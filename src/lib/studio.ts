import "server-only";
import { sql } from "@/lib/db";
import { getProduct } from "@/data/products";

function priceToNumber(price?: string): number {
  if (!price) return 0;
  return Number(price.replace(/[^0-9]/g, "")) || 0;
}

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
      });
    }
    const o = map.get(key)!;
    const p = getProduct(r.product_slug);
    const price = p?.price ?? "";
    o.items.push({ name: p?.name ?? r.product_slug, size: r.size, quantity: r.quantity, price });
    o.total += priceToNumber(price) * r.quantity;
  }
  return [...map.values()];
}

export type StudioStats = {
  orders: number;
  pending: number;
  waitlist: number;
  messages: number;
};

export async function getStudioStats(): Promise<StudioStats> {
  const [orders, pending, waitlist, messages] = await Promise.all([
    sql`SELECT COUNT(DISTINCT order_ref)::int AS c FROM reservations`,
    sql`SELECT COUNT(DISTINCT order_ref)::int AS c FROM reservations WHERE status = 'pending'`,
    sql`SELECT COUNT(*)::int AS c FROM waitlist_signups`,
    sql`SELECT COUNT(*)::int AS c FROM contact_messages`,
  ]);
  return {
    orders: (orders as { c: number }[])[0]?.c ?? 0,
    pending: (pending as { c: number }[])[0]?.c ?? 0,
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
