"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ModalShell } from "./ModalShell";
import { products } from "@/data/products";

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) =>
      [p.name, p.color, p.short, p.status].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  const hasQuery = query.trim().length > 0;

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="search-modal-title" className="max-w-lg" from="top">
      <h2 id="search-modal-title" className="sr-only">
        Search ADAB
      </h2>
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-muted px-4 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pieces, drops, notes…"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        {hasQuery && (
          <button
            type="button"
            className="shrink-0 rounded-full bg-primary px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90 animate-in fade-in duration-200"
          >
            Search
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Close search"
          className="shrink-0 p-1.5 text-foreground transition-colors hover:text-primary"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="min-h-[240px] max-h-[55vh] overflow-y-auto bg-[color:var(--paper)] px-4 py-4">
        {!hasQuery ? (
          <div className="space-y-2">
            <p className="px-1 pb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Suggestions
            </p>
            {products.map((p) => (
              <ResultRow key={p.slug} slug={p.slug} name={p.name} price={p.price} image={p.images[0]} onClose={onClose} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-1 py-10 text-center text-sm text-muted-foreground">
            Nothing found for “{query.trim()}”.
          </p>
        ) : (
          <div className="space-y-2">
            {results.map((p) => (
              <ResultRow key={p.slug} slug={p.slug} name={p.name} price={p.price} image={p.images[0]} onClose={onClose} />
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function ResultRow({
  slug,
  name,
  price,
  image,
  onClose,
}: {
  slug: string;
  name: string;
  price: string;
  image: string;
  onClose: () => void;
}) {
  return (
    <Link
      href={`/product/${slug}`}
      onClick={onClose}
      className="flex items-center gap-3 rounded-xl bg-background p-2.5 transition-colors hover:bg-background/70"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[color:var(--paper)]">
        <img src={image} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm">{name}</p>
      </div>
      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{price}</span>
    </Link>
  );
}
