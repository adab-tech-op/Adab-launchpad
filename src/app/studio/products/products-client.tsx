"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { DeleteProductButton } from "@/components/studio/DeleteProductButton";
import { cldUrl, IMG_W } from "@/lib/image-url";

export type ProductRow = {
  slug: string;
  name: string;
  color: string;
  price: string;
  image: string | null;
  visibility: string;
  live: boolean;
  stockText: string;
  stockLow: boolean;
};

export function ProductsClient({ rows }: { rows: ProductRow[] }) {
  const [q, setQ] = useState("");
  const [live, setLive] = useState("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (live === "live" && !r.live) return false;
      if (live === "not" && r.live) return false;
      if (!query) return true;
      return [r.name, r.slug, r.color, r.visibility].join(" ").toLowerCase().includes(query);
    });
  }, [rows, q, live]);

  const lowCount = rows.filter((r) => r.stockLow).length;
  const field = "rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 md:max-w-xs">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a name or address"
            aria-label="Search products"
            className={`${field} w-full pl-11`}
          />
        </div>
        <select value={live} onChange={(e) => setLive(e.target.value)} className={field} aria-label="Filter by visibility">
          <option value="all">Everything</option>
          <option value="live">Buyable now</option>
          <option value="not">Not buyable</option>
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "piece" : "pieces"}
          {lowCount > 0 && `, ${lowCount} low on stock`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="paper-grain mt-6 rounded-2xl border border-border p-12 text-center">
          <p className="font-editorial text-2xl italic text-muted-foreground">
            {rows.length === 0 ? "No pieces yet." : "Nothing matches that search."}
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
          <div className="hidden grid-cols-[62px_1fr_180px_170px_110px_90px] gap-4 bg-primary px-4 py-3 text-xs text-primary-foreground/80 lg:grid">
            <span />
            <span>Piece</span>
            <span>What visitors see</span>
            <span>Stock</span>
            <span>Price</span>
            <span />
          </div>

          {filtered.map((p) => (
            <div
              key={p.slug}
              className="grid grid-cols-1 items-center gap-3 border-t border-border p-4 lg:grid-cols-[62px_1fr_180px_170px_110px_90px] lg:gap-4"
            >
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[color:var(--paper)] lg:h-[78px] lg:w-[62px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image && <img src={cldUrl(p.image, IMG_W.thumb)} alt="" className="h-full w-full object-cover" />}
              </div>

              <div className="min-w-0">
                <p className="font-sans">{p.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {p.slug}
                  {p.color ? ` · ${p.color}` : ""}
                </p>
              </div>

              {/* A bare status word said nothing about pieces on a drop
                  schedule, which is most of them. */}
              <span className="text-sm">{p.visibility}</span>

              <span className={`text-sm ${p.stockLow ? "text-destructive" : ""}`}>{p.stockText}</span>

              <span className="text-sm">{p.price}</span>

              <div className="flex items-center justify-end gap-3">
                <Link href={`/studio/products/${p.slug}/edit`} className="text-sm text-primary underline underline-offset-4">
                  Edit
                </Link>
                <DeleteProductButton slug={p.slug} name={p.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NewProductLink() {
  return (
    <Link
      href="/studio/products/new"
      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.06em] text-primary-foreground transition-opacity hover:opacity-90"
    >
      <Plus className="h-4 w-4" /> New product
    </Link>
  );
}
