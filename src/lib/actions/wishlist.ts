"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { currentUserId } from "@/lib/auth-guard";
import { currentUserIsStaff } from "@/lib/roles";
import { getProductBySlug } from "@/lib/products";

export type WishlistResult = { ok: true; saved: boolean } | { ok: false; error: string };

export async function toggleWishlist(slug: string): Promise<WishlistResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in to save pieces." };
  if (await currentUserIsStaff()) return { ok: false, error: "Admin accounts don't have a wishlist." };
  if (!(await getProductBySlug(slug))) return { ok: false, error: "Unknown product." };

  try {
    const existing = (await sql`
      SELECT 1 FROM wishlist_items WHERE user_id = ${userId} AND product_slug = ${slug}
    `) as unknown[];
    if (existing.length > 0) {
      await sql`DELETE FROM wishlist_items WHERE user_id = ${userId} AND product_slug = ${slug}`;
      revalidatePath("/account/wishlist");
      return { ok: true, saved: false };
    }
    await sql`
      INSERT INTO wishlist_items (user_id, product_slug)
      VALUES (${userId}, ${slug})
      ON CONFLICT (user_id, product_slug) DO NOTHING
    `;
    revalidatePath("/account/wishlist");
    return { ok: true, saved: true };
  } catch (err) {
    console.error("[wishlist] toggle failed", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function isWishlisted(slug: string): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;
  const rows = (await sql`
    SELECT 1 FROM wishlist_items WHERE user_id = ${userId} AND product_slug = ${slug}
  `) as unknown[];
  return rows.length > 0;
}

export async function removeFromWishlist(slug: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  await sql`DELETE FROM wishlist_items WHERE user_id = ${userId} AND product_slug = ${slug}`;
  revalidatePath("/account/wishlist");
}
