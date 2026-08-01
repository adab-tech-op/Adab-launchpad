"use server";

import { z } from "zod";
import { sql } from "@/lib/db";
import { generateOrderRef } from "@/lib/order-ref";

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

const itemSchema = z.object({
  product_slug: z.string().trim().min(1).max(120),
  size: z.enum(SIZES),
  quantity: z.number().int().min(1).max(10),
});

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(3).max(40),
  delivery_address: z.string().trim().max(1000).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1).max(20),
});

export type ReservationResult =
  | { ok: true; orderRef: string }
  | { ok: false; error: string };

/**
 * Create a reservation ("order"). All line items are written under one shared
 * order_ref inside a single transaction, so an order is the set of reservation
 * rows carrying that ref.
 */
export async function createReservation(input: {
  name: string;
  email: string;
  phone: string;
  delivery_address?: string;
  notes?: string;
  items: { product_slug: string; size: string; quantity: number }[];
}): Promise<ReservationResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { name, email, phone, delivery_address, notes, items } = parsed.data;
  const orderRef = generateOrderRef();

  try {
    await sql.transaction(
      items.map(
        (it) => sql`
          INSERT INTO reservations
            (order_ref, name, email, phone, product_slug, size, quantity, delivery_address, notes)
          VALUES
            (${orderRef}, ${name}, ${email}, ${phone}, ${it.product_slug}, ${it.size},
             ${it.quantity}, ${delivery_address || null}, ${notes || null})
        `,
      ),
    );
    return { ok: true, orderRef };
  } catch (err) {
    console.error("[reservation] insert failed", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
