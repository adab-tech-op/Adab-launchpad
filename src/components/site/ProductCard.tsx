import Link from "next/link";
import type { Product } from "@/data/products";

export function ProductCard({ product }: { product: Product }) {
  const primary = product.images[0];
  const hover = product.images[1] ?? primary;
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[color:var(--paper)]">
        <img
          src={primary}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
        />
        <img
          src={hover}
          alt=""
          loading="lazy"
          width={1024}
          height={1280}
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
        <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-foreground">
          {product.status}
        </span>
        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="rounded-full bg-foreground px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-background">
            View Product
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="min-w-0">
          <h3 className="font-sans text-lg leading-tight">{product.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{product.color}</p>
        </div>
        <div className="shrink-0 text-left md:text-right">
          <p className="text-sm tabular-nums">{product.price}</p>
          {product.foundingNote && (
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-primary">
              {product.foundingNote}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {product.swatches.map((s) => (
          <span
            key={s.name}
            title={s.name}
            className="h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: s.hex }}
          />
        ))}
      </div>
    </Link>
  );
}
