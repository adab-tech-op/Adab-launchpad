import "server-only";
import { sql } from "@/lib/db";
import { getProduct } from "@/data/products";

function priceToNumber(price?: string): number {
  if (!price) return 0;
  return Number(price.replace(/[^0-9]/g, "")) || 0;
}

export type OrderItem = {
  slug: string;
  name: string;
  price: string;
  size: string;
  quantity: number;
};

export type Order = {
  orderRef: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  total: number;
};

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  let rows: {
    order_ref: string | null;
    product_slug: string;
    size: string;
    quantity: number;
    status: string;
    created_at: string;
  }[] = [];
  try {
    rows = (await sql`
      SELECT order_ref, product_slug, size, quantity, status, created_at
      FROM reservations
      WHERE lower(email) = lower(${email})
      ORDER BY created_at DESC
    `) as typeof rows;
  } catch (err) {
    console.error("[queries] getOrdersByEmail failed", err);
    return [];
  }

  const map = new Map<string, Order>();
  for (const r of rows) {
    const key = r.order_ref ?? `no-ref-${r.product_slug}-${r.created_at}`;
    if (!map.has(key)) {
      map.set(key, {
        orderRef: r.order_ref ?? "—",
        status: r.status,
        createdAt: r.created_at,
        items: [],
        total: 0,
      });
    }
    const order = map.get(key)!;
    const product = getProduct(r.product_slug);
    const price = product?.price ?? "";
    order.items.push({
      slug: r.product_slug,
      name: product?.name ?? r.product_slug,
      price,
      size: r.size,
      quantity: r.quantity,
    });
    order.total += priceToNumber(price) * r.quantity;
  }
  return [...map.values()];
}

export type OrderByRef = {
  orderRef: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  items: OrderItem[];
  total: number;
  hasPayment: boolean;
};

export async function getOrderByRef(orderRef: string): Promise<OrderByRef | null> {
  let rows: {
    name: string;
    email: string;
    phone: string;
    product_slug: string;
    size: string;
    quantity: number;
    status: string;
  }[] = [];
  try {
    rows = (await sql`
      SELECT name, email, phone, product_slug, size, quantity, status
      FROM reservations WHERE order_ref = ${orderRef}
    `) as typeof rows;
  } catch (err) {
    console.error("[queries] getOrderByRef failed", err);
    return null;
  }
  if (rows.length === 0) return null;

  let hasPayment = false;
  try {
    const pay = (await sql`SELECT 1 FROM payments WHERE order_ref = ${orderRef}`) as unknown[];
    hasPayment = pay.length > 0;
  } catch {
    hasPayment = false;
  }

  const first = rows[0];
  const items: OrderItem[] = [];
  let total = 0;
  for (const r of rows) {
    const p = getProduct(r.product_slug);
    const price = p?.price ?? "";
    items.push({ slug: r.product_slug, name: p?.name ?? r.product_slug, price, size: r.size, quantity: r.quantity });
    total += priceToNumber(price) * r.quantity;
  }
  return { orderRef, name: first.name, email: first.email, phone: first.phone, status: first.status, items, total, hasPayment };
}

export async function getWishlistSlugs(userId: string): Promise<string[]> {
  try {
    const rows = (await sql`
      SELECT product_slug FROM wishlist_items
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `) as { product_slug: string }[];
    return rows.map((r) => r.product_slug);
  } catch (err) {
    console.error("[queries] getWishlistSlugs failed", err);
    return [];
  }
}

export type Profile = {
  phone: string;
  default_size: string;
  address_line: string;
  city: string;
  area: string;
  postal_code: string;
};

export async function getProfile(userId: string): Promise<Profile> {
  const empty: Profile = {
    phone: "",
    default_size: "",
    address_line: "",
    city: "",
    area: "",
    postal_code: "",
  };
  try {
    const rows = (await sql`
      SELECT phone, default_size, address_line, city, area, postal_code
      FROM profiles WHERE user_id = ${userId}
    `) as Partial<Profile>[];
    const p = rows[0] ?? {};
    return {
      phone: p.phone ?? "",
      default_size: p.default_size ?? "",
      address_line: p.address_line ?? "",
      city: p.city ?? "",
      area: p.area ?? "",
      postal_code: p.postal_code ?? "",
    };
  } catch (err) {
    console.error("[queries] getProfile failed", err);
    return empty;
  }
}
