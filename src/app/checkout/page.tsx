import { getProductBySlug } from "@/lib/products";
import { CheckoutClient } from "./checkout-client";

export const metadata = { title: "Checkout — ADAB" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; size?: string; color?: string; qty?: string }>;
}) {
  const sp = await searchParams;
  const buyNowProduct = sp.slug ? await getProductBySlug(sp.slug) : null;
  return <CheckoutClient buyNowProduct={buyNowProduct} size={sp.size} color={sp.color} qty={sp.qty} />;
}
