import type { MetadataRoute } from "next";
import { getShopVisibleProducts } from "@/lib/products";
import { getIsolationMode } from "@/lib/settings-server";

// Set NEXT_PUBLIC_SITE_URL (e.g. https://adab.co) to emit absolute URLs.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Route handlers do not pass through the root layout, so the isolation gate
  // never sees them. Left alone, this would publish the full URL list —
  // including every product slug — while the site itself is closed.
  if (await getIsolationMode()) return [];

  const products = await getShopVisibleProducts();
  const paths = [
    "/",
    "/shop",
    "/drop",
    "/adab-story",
    "/care-guide",
    "/scrapbook",
    "/contact",
    "/cart",
    ...products.map((p) => `/product/${p.slug}`),
  ];

  return paths.map((p) => ({
    url: `${BASE_URL}${p}`,
    changeFrequency: "weekly",
  }));
}
