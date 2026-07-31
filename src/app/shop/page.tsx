import type { Metadata } from "next";
import { ShopClient } from "./shop-client";

export const metadata: Metadata = {
  title: "Shop — ADAB",
  description:
    "Founding pieces in limited quantities. No guaranteed restock. Premium heritage-fusion menswear from Bangladesh.",
};

export default function ShopPage() {
  return <ShopClient />;
}
