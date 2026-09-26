import { getShopVisibleProducts } from "@/lib/products";
import { getHomeContent } from "@/lib/page-content-server";
import { getScrapbookImages } from "@/lib/scrapbook-server";
import { HomeClient } from "./home-client";

// Revalidate so catalog edits from /studio appear within a minute.
export const revalidate = 60;

export default async function Home() {
  const [products, home, scrapbook] = await Promise.all([
    getShopVisibleProducts(),
    getHomeContent(),
    getScrapbookImages(),
  ]);

  // The teaser strip shows the first four scrapbook entries in their own sort
  // order, so it is curated from Studio → Scrapbook rather than from four
  // hardcoded files. Reordering there decides what the homepage shows, and
  // the homepage can never drift from the real scrapbook.
  const teasers = scrapbook.slice(0, 4).map((s) => s.image_url).filter(Boolean);

  return <HomeClient products={products} home={home} scrapbookTeasers={teasers} />;
}
