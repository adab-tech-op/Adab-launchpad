import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLatestProducts } from "@/lib/products";
import { getLatestCount } from "@/lib/settings-server";
import { ShopClient } from "@/app/shop/shop-client";

// Revalidate so new drops + the admin's count change appear within a minute.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Latest — ADAB",
  description: "The newest ADAB pieces. Founding drops in limited quantities.",
};

export default async function LatestPage() {
  const count = await getLatestCount();
  const products = await getLatestProducts(count);

  // Exactly one latest piece → send the visitor straight to it.
  if (products.length === 1) redirect(`/product/${products[0].slug}`);

  return <ShopClient products={products} eyebrow="Latest" heading="Latest." showComingSoon={false} />;
}
