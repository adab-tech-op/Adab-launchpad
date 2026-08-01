import { Suspense } from "react";
import { CheckoutClient } from "./checkout-client";

export const metadata = { title: "Checkout — ADAB" };

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <CheckoutClient />
    </Suspense>
  );
}
