import type { Metadata } from "next";
import { CartClient } from "./cart-client";

export const metadata: Metadata = {
  title: "Cart — ADAB",
  description: "Your ADAB cart.",
};

export default function CartPage() {
  return <CartClient />;
}
