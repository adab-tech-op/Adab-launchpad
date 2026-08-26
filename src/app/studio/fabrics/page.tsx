import { redirect } from "next/navigation";
import { requireStudioAccess, atLeast } from "@/lib/roles";
import { getFabricTypes } from "@/lib/fabrics-server";
import { FabricsClient } from "./fabrics-client";

export const metadata = { title: "Fabrics — ADAB Studio" };

export default async function FabricsPage() {
  const actor = await requireStudioAccess();
  if (!atLeast(actor.role, "admin")) redirect("/studio");
  const fabrics = await getFabricTypes();

  return (
    <div>
      <h1 className="font-editorial text-4xl">Fabrics.</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Each fabric type carries its own care guide. Products pick a fabric type, and its care shows on
        the product page and in the searchable Care Guide. Create a type here before assigning it to a product.
      </p>
      <div className="mt-8">
        <FabricsClient initial={fabrics} />
      </div>
    </div>
  );
}
