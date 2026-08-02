import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { getAllProducts } from "@/lib/products";
import { DeleteProductButton } from "@/components/studio/DeleteProductButton";

export const metadata = { title: "Products — ADAB Studio" };

export default async function StudioProducts() {
  const products = await getAllProducts();
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-editorial text-4xl">Products.</h1>
        <Link href="/studio/products/new" className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-background hover:bg-foreground/85 transition-colors">
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Create and edit catalog pieces. Changes appear on the site within a minute.
      </p>

      <div className="mt-8 space-y-3">
        {products.map((p) => (
          <div key={p.slug} className="flex items-center gap-4 rounded-2xl border border-border p-4">
            <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-[color:var(--paper)]">
              {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.color} · {p.price}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[color:var(--paper)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {p.status}
            </span>
            <Link href={`/studio/products/${p.slug}/edit`} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label={`Edit ${p.name}`}>
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <DeleteProductButton slug={p.slug} name={p.name} />
          </div>
        ))}
      </div>
    </div>
  );
}
