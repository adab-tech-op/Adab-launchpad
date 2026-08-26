import type { Metadata } from "next";
import { getAllProducts } from "@/lib/products";
import { getBanner } from "@/lib/settings-server";
import { ShopClient } from "./shop-client";

// Revalidate so catalog edits from /studio appear within a minute.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop — ADAB",
  description:
    "Founding pieces in limited quantities. No guaranteed restock. Premium heritage-fusion menswear from Bangladesh.",
};

export default async function ShopPage() {
  const [products, banner] = await Promise.all([getAllProducts(), getBanner()]);
  return <ShopClient products={products} banner={banner} />;
}
