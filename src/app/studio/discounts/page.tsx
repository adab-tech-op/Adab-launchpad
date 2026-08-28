import { redirect } from "next/navigation";
import { requireStudioAccess, atLeast } from "@/lib/roles";
import { getCoupons } from "@/lib/coupons-server";
import { getAllProducts } from "@/lib/products";
import { DiscountsClient } from "./discounts-client";

export const metadata = { title: "Discounts — ADAB Studio" };

export default async function DiscountsPage() {
  const actor = await requireStudioAccess();
  if (!atLeast(actor.role, "admin")) redirect("/studio");
  const [coupons, products] = await Promise.all([getCoupons(), getAllProducts()]);

  return (
    <div>
      <h1 className="font-editorial text-4xl">Discounts.</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Coupon codes. Codes are private — a discount only applies when a customer enters a valid code at
        checkout. A used slot commits when payment is submitted and frees again if the order is cancelled,
        and each code is once per customer email. (Product <em>sales</em> are set on each product.)
      </p>
      <div className="mt-8">
        <DiscountsClient
          initial={coupons}
          products={products.map((p) => ({ slug: p.slug, name: p.name }))}
        />
      </div>
    </div>
  );
}
