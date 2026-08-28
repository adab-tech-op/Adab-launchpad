"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireMutator, recordAudit } from "@/lib/roles";
import { normalizeCode, validateCoupon, type OrderItem } from "@/lib/coupons-server";

export type CouponResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  code: z.string().trim().min(2, "Code is required.").max(40),
  percent: z.coerce.number().int().min(1, "1–90%.").max(90),
  product_slug: z.string().trim().max(80).optional().or(z.literal("")),
  active: z.boolean().optional(),
  expires_at: z.string().trim().optional().or(z.literal("")),
  max_uses: z.coerce.number().int().min(1).max(100000).nullable().optional(),
});

export async function createCoupon(input: unknown): Promise<CouponResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the fields." };
  const code = normalizeCode(p.data.code);
  if (!code) return { ok: false, error: "Code must contain letters or numbers." };
  try {
    await sql`
      INSERT INTO coupon_codes (code, percent, product_slug, active, expires_at, max_uses)
      VALUES (${code}, ${p.data.percent}, ${p.data.product_slug || null}, ${p.data.active ?? true},
              ${p.data.expires_at || null}, ${p.data.max_uses ?? null})
    `;
    await recordAudit(actor.email, "coupon.create", code);
    revalidatePath("/studio/discounts");
    return { ok: true };
  } catch (err) {
    console.error("[coupons] create failed", err);
    return { ok: false, error: "Could not create — that code may already exist. (First one? run db/coupons.sql.)" };
  }
}

export async function updateCoupon(id: number, input: unknown): Promise<CouponResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the fields." };
  try {
    await sql`
      UPDATE coupon_codes SET
        percent = ${p.data.percent}, product_slug = ${p.data.product_slug || null},
        active = ${p.data.active ?? true}, expires_at = ${p.data.expires_at || null},
        max_uses = ${p.data.max_uses ?? null}
      WHERE id = ${id}
    `;
    await recordAudit(actor.email, "coupon.update", String(id));
    revalidatePath("/studio/discounts");
    return { ok: true };
  } catch (err) {
    console.error("[coupons] update failed", err);
    return { ok: false, error: "Could not save." };
  }
}

export async function deleteCoupon(id: number): Promise<CouponResult> {
  const actor = await requireMutator();
  if (!actor) return { ok: false, error: "Not authorized." };
  try {
    await sql`DELETE FROM coupon_codes WHERE id = ${id}`;
    await recordAudit(actor.email, "coupon.delete", String(id));
    revalidatePath("/studio/discounts");
    return { ok: true };
  } catch (err) {
    console.error("[coupons] delete failed", err);
    return { ok: false, error: "Could not delete." };
  }
}

/** Checkout preview: validate a code against the cart + email, return the %. */
export async function checkCoupon(
  code: string,
  items: OrderItem[],
  email: string,
): Promise<{ ok: true; percent: number; code: string } | { ok: false; error: string }> {
  if (!email || !email.includes("@")) return { ok: false, error: "Enter your email first, then apply the code." };
  const res = await validateCoupon(code, items, email);
  if (!res.ok) return res;
  return { ok: true, percent: res.coupon.percent, code: res.coupon.code };
}
