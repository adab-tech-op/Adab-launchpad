"use client";

import { useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { products } from "@/data/products";
import { SlidersHorizontal, X } from "lucide-react";

const placeholderImg = "/assets/coming-soon-placeholder.jpg";

const TYPES = ["Piran", "Hoodie"];
const SIZES = ["S", "M", "L", "XL", "XXL"];
const COLORS = [
  { name: "Warm Charcoal", hex: "#2b2b2e" },
  { name: "Steel Blue", hex: "#4682b4" },
  { name: "Prussian", hex: "#003153" },
  { name: "Parchment", hex: "#f5f0e8" },
];

const COMING_SOON = [
  "Pattern in development",
  "Pattern in development",
  "Pattern in development",
  "Pattern in development",
];

export function ShopClient() {
  const [sort, setSort] = useState("Featured");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Top banner */}
      <div className="border-b border-border bg-[color:var(--paper)]">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-3 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/80">
            Founding Drop — this price will not repeat.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 md:px-8 pt-16 md:pt-24 pb-12">
        <p className="font-display text-[11px] text-primary">Drop 01</p>
        <h1 className="mt-3 font-editorial text-5xl md:text-6xl">Shop.</h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
          Founding pieces in limited quantities. No guaranteed restock.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-24">
        <div className="mb-8 flex items-center justify-between border-y border-border py-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex items-center gap-2 text-xs uppercase tracking-[0.18em]"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
            Filter
          </button>
          <div className="hidden lg:flex gap-8 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span>Type: All</span>
            <span>Size: All</span>
            <span>Color: All</span>
            <span>Availability: All</span>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent text-xs uppercase tracking-[0.18em] outline-none"
          >
            <option>Featured</option>
            <option>Newest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
          {COMING_SOON.map((label, i) => (
            <ComingSoonCard key={i} label={label} />
          ))}
        </div>
      </section>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-full rounded-t-3xl bg-background p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-xl">Filter</h3>
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <FilterGroup title="Type" items={TYPES} />
            <FilterGroup title="Size" items={SIZES} />
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Color
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <span
                    key={c.name}
                    className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="mt-8 w-full rounded-full bg-foreground py-3 text-xs uppercase tracking-[0.18em] text-background"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ComingSoonCard({ label }: { label: string }) {
  return (
    <div className="group block cursor-default">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[color:var(--paper)]">
        <img
          src={placeholderImg}
          alt=""
          loading="lazy"
          width={1024}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="rounded-full bg-background/90 px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] text-foreground">
            Coming Soon
          </span>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="font-sans text-lg leading-tight text-muted-foreground">
          {label}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Non-clickable · arriving in a future drop
        </p>
      </div>
    </div>
  );
}

function FilterGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((i) => (
          <span
            key={i}
            className="rounded-full border border-border px-3 py-1.5 text-xs"
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}
