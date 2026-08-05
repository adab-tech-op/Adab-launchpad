import "server-only";
import { sql } from "@/lib/db";
import { getProductMap } from "@/lib/products";

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

  const productMap = await getProductMap();
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
    const product = productMap.get(r.product_slug);
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
  createdAt: string;
  items: OrderItem[];
  total: number;
  hasPayment: boolean;
  payment: { bkashNumber: string; trxId: string; amount: number | null; submittedAt: string } | null;
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
    created_at: string;
  }[] = [];
  try {
    rows = (await sql`
      SELECT name, email, phone, product_slug, size, quantity, status, created_at
      FROM reservations WHERE order_ref = ${orderRef}
    `) as typeof rows;
  } catch (err) {
    console.error("[queries] getOrderByRef failed", err);
    return null;
  }
  if (rows.length === 0) return null;

  let payment: OrderByRef["payment"] = null;
  try {
    const pay = (await sql`
      SELECT bkash_number, trx_id, amount, submitted_at FROM payments WHERE order_ref = ${orderRef}
    `) as { bkash_number: string; trx_id: string; amount: number | null; submitted_at: string }[];
    if (pay[0]) {
      payment = { bkashNumber: pay[0].bkash_number, trxId: pay[0].trx_id, amount: pay[0].amount, submittedAt: pay[0].submitted_at };
    }
  } catch {
    payment = null;
  }

  const productMap = await getProductMap();
  const first = rows[0];
  const items: OrderItem[] = [];
  let total = 0;
  for (const r of rows) {
    const p = productMap.get(r.product_slug);
    const price = p?.price ?? "";
    items.push({ slug: r.product_slug, name: p?.name ?? r.product_slug, price, size: r.size, quantity: r.quantity });
    total += priceToNumber(price) * r.quantity;
  }
  return {
    orderRef,
    name: first.name,
    email: first.email,
    phone: first.phone,
    status: first.status,
    createdAt: first.created_at,
    items,
    total,
    hasPayment: Boolean(payment),
    payment,
  };
}

/** True if a Better Auth account already exists for this email. */
export async function hasAccountForEmail(email: string): Promise<boolean> {
  try {
    const rows = (await sql`
      SELECT 1 FROM "user" WHERE lower("email") = lower(${email}) LIMIT 1
    `) as unknown[];
    return rows.length > 0;
  } catch (err) {
    console.error("[queries] hasAccountForEmail failed", err);
    return false;
  }
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
