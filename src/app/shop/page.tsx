import type { Metadata } from "next";
import { getShopVisibleProducts } from "@/lib/products";
import { getBanner } from "@/lib/settings-server";
import { getActiveTeasers } from "@/lib/teasers-server";
import { getShopContent } from "@/lib/page-content-server";
import { ShopClient } from "./shop-client";

export const metadata: Metadata = { title: "Shop — ADAB" };
export const revalidate = 60;

export default async function ShopPage() {
  const [products, banner, teasers, content] = await Promise.all([
    getShopVisibleProducts(),
    getBanner(),
    getActiveTeasers(),
    getShopContent(),
  ]);
  return <ShopClient products={products} banner={banner} teasers={teasers} heading={content.heading} subcopy={content.subcopy} />;
}
