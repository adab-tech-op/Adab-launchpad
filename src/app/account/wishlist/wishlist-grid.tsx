"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { removeFromWishlist } from "@/lib/actions/wishlist";

type Tile = { slug: string; name: string; price: string; image: string; color: string };

export function WishlistGrid({ initial }: { initial: Tile[] }) {
  const [tiles, setTiles] = useState(initial);

  const remove = async (slug: string) => {
    setTiles((t) => t.filter((x) => x.slug !== slug));
    await removeFromWishlist(slug);
  };

  if (tiles.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-border p-12 text-center paper-grain">
        <p className="font-editorial text-2xl italic text-muted-foreground">Your wishlist is empty.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background">
          Browse the Drop
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
      {tiles.map((t) => (
        <div key={t.slug} className="group relative">
          <button
            onClick={() => remove(t.slug)}
            aria-label={`Remove ${t.name}`}
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <Link href={`/product/${t.slug}`} className="block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[color:var(--paper)]">
              <img src={t.image} alt={t.name} className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-sans text-lg leading-tight">{t.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t.color}</p>
              </div>
              <p className="text-sm tabular-nums">{t.price}</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
