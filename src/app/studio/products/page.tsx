import { getAllProducts } from "@/lib/products";

export default async function StudioProducts() {
  const products = await getAllProducts();
  return (
    <div>
      <h1 className="font-editorial text-4xl">Products.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The catalog currently lives in code (<code className="text-xs">src/data/products.ts</code>). This is a read-only
        view — DB-backed product editing can be added when the catalog grows.
      </p>
      <div className="mt-10 space-y-3">
        {products.map((p) => (
          <div key={p.slug} className="flex items-center gap-4 rounded-2xl border border-border p-4">
            <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-[color:var(--paper)]">
              <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.color} · {p.price}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[color:var(--paper)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
