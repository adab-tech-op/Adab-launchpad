import type { MetadataRoute } from "next";
import { products } from "@/data/products";

// Set NEXT_PUBLIC_SITE_URL (e.g. https://adab.co) to emit absolute URLs.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/shop",
    "/manifesto",
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
