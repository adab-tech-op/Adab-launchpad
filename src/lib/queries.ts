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
  const rows = (await sql`
    SELECT order_ref, product_slug, size, quantity, status, created_at
    FROM reservations
    WHERE lower(email) = lower(${email})
    ORDER BY created_at DESC
  `) as {
    order_ref: string | null;
    product_slug: string;
    size: string;
    quantity: number;
    status: string;
    created_at: string;
  }[];

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

export async function getWishlistSlugs(userId: string): Promise<string[]> {
  const rows = (await sql`
    SELECT product_slug FROM wishlist_items
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `) as { product_slug: string }[];
  return rows.map((r) => r.product_slug);
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
}
