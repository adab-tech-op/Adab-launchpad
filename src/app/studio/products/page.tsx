import { getAllProducts } from "@/lib/products";
import { getProductStock } from "@/lib/product-stock-server";
import { getDropWindowDays } from "@/lib/settings-server";
import { visibilityLabel, visibilityIsLive, stockLabel } from "@/lib/product-visibility";
import { ProductsClient, NewProductLink, type ProductRow } from "./products-client";

export const metadata = { title: "Products — ADAB Studio" };

const SIZES = ["S", "M", "L", "XL", "XXL"];

export default async function StudioProducts() {
  const [products, windowDays] = await Promise.all([getAllProducts(), getDropWindowDays()]);

  // Stock decides whether a piece can be sold at all and was not on this page,
  // so a piece two units from sold out looked identical to one with thirty.
  const rows: ProductRow[] = await Promise.all(
    products.map(async (p) => {
      const stock = await getProductStock(p.slug);
      const s = stockLabel(stock, SIZES);
      return {
        slug: p.slug,
        name: p.name,
        color: p.color ?? "",
        price: p.price,
        image: p.images[0] ?? null,
        visibility: visibilityLabel(p, windowDays),
        live: visibilityIsLive(p, windowDays),
        stockText: s.text,
        stockLow: s.low,
      };
    }),
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-editorial text-4xl">Products.</h1>
        <NewProductLink />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Create and edit catalog pieces. Changes appear on the site within a minute.
      </p>

      <ProductsClient rows={rows} />
    </div>
  );
}
