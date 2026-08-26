import { ProductForm } from "@/components/studio/ProductForm";
import { getFabricTypes } from "@/lib/fabrics-server";

export const metadata = { title: "New Product — ADAB Studio" };

export default async function NewProductPage() {
  const fabricTypes = await getFabricTypes();
  return (
    <div>
      <h1 className="font-editorial text-4xl">New product.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Fill in the details and upload images.</p>
      <div className="mt-8">
        <ProductForm mode="create" fabricTypes={fabricTypes} />
      </div>
    </div>
  );
}
