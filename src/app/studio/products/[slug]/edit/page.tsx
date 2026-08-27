import { notFound } from "next/navigation";
import { getProductForEdit } from "@/lib/actions/products-admin";
import { getProductStock } from "@/lib/product-stock-server";
import { getProductBySlug } from "@/lib/products";
import { ProductForm } from "@/components/studio/ProductForm";

export const metadata = { title: "Edit Product — ADAB Studio" };

export default async function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, stock, pub] = await Promise.all([
    getProductForEdit(slug),
    getProductStock(slug),
    getProductBySlug(slug),
  ]);
  if (!product) notFound();
  return (
    <div>
      <h1 className="font-editorial text-4xl">Edit product.</h1>
      <p className="mt-2 text-sm text-muted-foreground">{product.name}</p>
      <div className="mt-8">
        <ProductForm mode="edit" initial={product} initialStock={stock} initialSoldOut={pub?.soldOut ?? false} />
      </div>
    </div>
  );
}
