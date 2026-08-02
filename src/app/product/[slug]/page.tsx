import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProductSlugs, getAllProducts } from "@/lib/products";
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
  const allProducts = await getAllProducts();
  return <ProductClient product={product} allProducts={allProducts} />;
}
