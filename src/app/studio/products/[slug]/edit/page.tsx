import { notFound } from "next/navigation";
import { getProductForEdit } from "@/lib/actions/products-admin";
import { getFabricTypes } from "@/lib/fabrics-server";
import { ProductForm } from "@/components/studio/ProductForm";

export const metadata = { title: "Edit Product — ADAB Studio" };

export default async function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, fabricTypes] = await Promise.all([getProductForEdit(slug), getFabricTypes()]);
  if (!product) notFound();
  return (
    <div>
      <h1 className="font-editorial text-4xl">Edit product.</h1>
      <p className="mt-2 text-sm text-muted-foreground">{product.name}</p>
      <div className="mt-8">
        <ProductForm mode="edit" initial={product} fabricTypes={fabricTypes} />
      </div>
    </div>
  );
}
