import type { MetadataRoute } from "next";
import { getProductSlugs } from "@/lib/products";

// Set NEXT_PUBLIC_SITE_URL (e.g. https://adab.co) to emit absolute URLs.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [
    "/",
    "/shop",
    "/manifesto",
    "/care-guide",
    "/scrapbook",
    "/contact",
    "/cart",
    ...(await getProductSlugs()).map((slug) => `/product/${slug}`),
  ];

  return paths.map((p) => ({
    url: `${BASE_URL}${p}`,
    changeFrequency: "weekly",
  }));
}
