import { getDropWindowDays } from "@/lib/settings-server";
import { ProductForm } from "@/components/studio/ProductForm";
import { getFabricTypes } from "@/lib/fabrics-server";

export const metadata = { title: "New Product — ADAB Studio" };

export default async function NewProductPage() {
  const [fabricTypes, dropWindowDays] = await Promise.all([getFabricTypes(), getDropWindowDays()]);
  return (
    <div>
      <h1 className="font-editorial text-4xl">New product.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Only the name, address and price are required. Everything else can wait.</p>
      <div className="mt-8">
        <ProductForm mode="create" fabricTypes={fabricTypes} dropWindowDays={dropWindowDays} />
      </div>
    </div>
  );
}
