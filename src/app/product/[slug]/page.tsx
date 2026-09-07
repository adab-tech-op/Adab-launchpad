import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProductSlugs, getShopVisibleProducts } from "@/lib/products";
import { getProductStock } from "@/lib/product-stock-server";
import { getFabricCare } from "@/lib/fabrics-server";
import { getDropWindowDays } from "@/lib/settings-server";
import { dropStateOf, isUserVisible, isDropPurchasable } from "@/lib/drop";
import { currentUserIsStaff } from "@/lib/roles";
import { ProductClient } from "./product-client";

// New products (added in /studio) render on-demand; edits refresh within a minute.
export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product — ADAB" };
  const title = `${product.name} — ADAB`;
  return {
    title,
    description: product.short,
    openGraph: { title, description: product.short, images: [product.images[0]] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Drop-aware visibility: a scheduled piece is hidden until its window opens,
  // and a concluded one only shows if resurfaced to shop. Staff may preview.
  const windowDays = await getDropWindowDays();
  const state = dropStateOf(product, windowDays);
  let staffPreview = false;
  if (!isUserVisible(state, product.inShop)) {
    staffPreview = await currentUserIsStaff();
    if (!staffPreview) notFound();
  }
  const dropBuyable = product.dropDate ? isDropPurchasable(state) : true;

  const [allProducts, stock, fabricCare] = await Promise.all([
    getShopVisibleProducts(),
    getProductStock(slug),
    getFabricCare(product.fabricTypeId),
  ]);
  return (
    <ProductClient
      product={product}
      allProducts={allProducts}
      stock={stock}
      fabricCare={fabricCare}
      dropState={state}
      dropBuyable={dropBuyable}
      staffPreview={staffPreview}
    />
  );
}
