import { getAllProducts } from "@/lib/products";
import { getHomeContent } from "@/lib/page-content-server";
import { HomeClient } from "./home-client";

// Revalidate so catalog edits from /studio appear within a minute.
export const revalidate = 60;

export default async function Home() {
  const [products, home] = await Promise.all([getAllProducts(), getHomeContent()]);
  return <HomeClient products={products} home={home} />;
}
