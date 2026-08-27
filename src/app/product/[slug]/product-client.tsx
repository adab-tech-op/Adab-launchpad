"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { type Product } from "@/data/products";
import { ProductCard } from "@/components/site/ProductCard";
import { WishlistButton } from "@/components/site/WishlistButton";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

// Feature flag: Founding Drop reservations vs. standard Add to Cart.
// Flip to false once fulfilment + cart checkout are live.
const dropModeActive = true;

// Standard copy for the Fit / Care / Delivery accordions. Each product may
// override these from the studio form; when its field is blank we fall back to
// this, so the section always renders and boilerplate never needs retyping.
const DEFAULT_FIT =
  "Adab pieces are cut with a considered, relaxed fit. Choose your usual size, or size up for extra room.";
const DEFAULT_CARE =
  "Cold machine wash, inside out. Line dry in shade. Iron on medium with cloth in between.";
const DEFAULT_DELIVERY =
  "Dispatched from Dhaka within 48 hours of drop fulfilment. 7-day returns on unworn pieces with tags.";

const SIZES = ["S", "M", "L", "XL", "XXL"];
const SIZE_TABLE = [
  { size: "S", chest: 40, length: 30, sleeve: 24, shoulder: 17 },
  { size: "M", chest: 42, length: 31, sleeve: 24.5, shoulder: 18 },
  { size: "L", chest: 44, length: 32, sleeve: 25, shoulder: 19 },
  { size: "XL", chest: 46, length: 32.5, sleeve: 25.5, shoulder: 19.5 },
  { size: "XXL", chest: 48, length: 33, sleeve: 26, shoulder: 20 },
];

export function ProductClient({ product, allProducts, fabricCare }: { product: Product; allProducts: Product[]; fabricCare?: string | null }) {
  const router = useRouter();
  const { addItem, items, removeItem } = useCart();
  const [size, setSize] = useState("L");
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(product.swatches[0]?.name ?? product.color);
  const [zoom, setZoom] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const idx = allProducts.findIndex((p) => p.slug === product.slug);
  const prev = allProducts[(idx - 1 + allProducts.length) % allProducts.length];
  const next = allProducts[(idx + 1) % allProducts.length];

  const detailsList = product.details ?? [];

  const primaryCta = () => {
    if (dropModeActive) {
      router.push(
        `/checkout?slug=${product.slug}&size=${encodeURIComponent(size)}&color=${encodeURIComponent(color)}&qty=${qty}`,
      );
    } else {
      toggleCart();
    }
  };

  const ctaLabel = dropModeActive ? "Reserve your piece" : "Add to Cart";

  const cartId = `${product.slug}-${size}-${color}`;
  const inCart = items.some((i) => i.id === cartId);

  const toggleCart = () => {
    if (inCart) {
      removeItem(cartId);
      toast("Removed from cart");
    } else {
      addItem({
        slug: product.slug,
        name: product.name,
        size,
        color,
        qty,
        price: Number(product.price.replace(/[^0-9]/g, "")) || 0,
        image: product.images[0],
      });
      toast.success("Added to cart");
    }
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-5 md:px-8 pt-6 md:pt-10">
        <nav className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <Link href="/shop" className="hover:text-foreground">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-5 md:px-8 py-8 md:py-12 pb-28 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left sticky story panel — desktop */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24">
              <p className="font-display text-[11px] tracking-[0.24em] text-primary">
                FOUNDING DROP
              </p>
              <h1 className="mt-3 font-editorial text-4xl leading-[1.05]">
                {product.name}
              </h1>
              <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                {product.short}
              </p>
              {detailsList.length > 0 && (
                <ul className="mt-6 space-y-2 text-sm text-foreground/80">
                  {detailsList.map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                </ul>
              )}
              {product.modelNote && (
                <p className="mt-6 text-xs text-muted-foreground italic">
                  {product.modelNote}
                </p>
              )}
            </div>
          </aside>

          {/* Center gallery */}
          <div className="lg:col-span-6">
            {/* Mobile: horizontal carousel */}
            <div className="lg:hidden -mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-2">
              {product.images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="h-[70vh] w-[85vw] snap-center rounded-2xl object-cover shrink-0"
                />
              ))}
            </div>
            {/* Desktop: vertical stack with click-to-zoom */}
            <div className="hidden lg:grid grid-cols-1 gap-3">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setZoom(src)}
                  className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[color:var(--paper)] cursor-zoom-in"
                >
                  <img
                    src={src}
                    alt={`${product.name} — view ${i + 1}`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                  />
                </button>
              ))}
            </div>

            {/* Mobile info block */}
            <div className="lg:hidden mt-6">
              <p className="font-display text-[11px] tracking-[0.24em] text-primary">FOUNDING DROP</p>
              <h1 className="mt-2 font-editorial text-3xl leading-tight">{product.name}</h1>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {product.short}
              </p>
              {detailsList.length > 0 && (
                <ul className="mt-5 space-y-2 text-sm text-foreground/80">
                  {detailsList.map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right purchase panel */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div>
                <p className="text-xl font-sans">{product.price}</p>
                {product.foundingNote && (
                  <p className="mt-1 text-xs text-primary uppercase tracking-[0.16em]">
                    {product.foundingNote}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Color · {color}
                </p>
                <div className="mt-2 flex gap-2">
                  {product.swatches.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => setColor(s.name)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${color === s.name ? "border-foreground" : "border-border"}`}
                      style={{ backgroundColor: s.hex }}
                      aria-label={s.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Size
                  </p>
                  <button
                    onClick={() => setGuideOpen(true)}
                    className="text-xs uppercase tracking-[0.16em] text-foreground underline underline-offset-4"
                  >
                    Size guide
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`rounded-md border py-2 text-sm transition-colors ${size === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Quantity
                </p>
                <div className="mt-2 inline-flex items-center gap-4 rounded-full border border-border px-4 py-2">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                    <Minus className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <span className="w-6 text-center tabular-nums">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} aria-label="Increase">
                    <Plus className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <button
                onClick={primaryCta}
                className="hidden lg:block w-full rounded-full py-4 text-xs uppercase tracking-[0.2em] bg-foreground text-background hover:bg-foreground/85 transition-colors"
              >
                {ctaLabel}
              </button>

              <div className="hidden lg:grid grid-cols-2 gap-3">
                <WishlistButton slug={product.slug} />
                <button
                  onClick={toggleCart}
                  className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-full border py-3.5 text-[11px] uppercase tracking-[0.14em] transition-colors active:scale-[0.98] ${
                    inCart ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground"
                  }`}
                >
                  {inCart ? <Check className="h-4 w-4" strokeWidth={1.75} /> : <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />}
                  {inCart ? "In cart" : "Add to cart"}
                </button>
              </div>

              {/* Trust signals */}
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>· Made in Bangladesh</li>
                <li>· Limited Drop — no restock</li>
                <li>· Advance payment secures your piece</li>
              </ul>

              {/* Payment logos — bKash only until other rails ship */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded border border-border px-2 py-1">bKash</span>
              </div>
            </div>
          </aside>
        </div>

        {/* Accordions */}
        <div className="mt-20 max-w-3xl mx-auto">
          {product.story && (
            <Accordion title="Product Story" defaultOpen>
              <p className="whitespace-pre-line">{product.story}</p>
            </Accordion>
          )}
          <Accordion title="Fabric & Craft">
            <p>
              {product.fabricNote || product.short}
            </p>
          </Accordion>
          <Accordion title="Fit & Sizing">
            <p className="whitespace-pre-line">{product.fitNote || DEFAULT_FIT}</p>
          </Accordion>
          <Accordion title="Care Guide">
            <p className="whitespace-pre-line">{product.careNote || fabricCare || DEFAULT_CARE}</p>
          </Accordion>
          <Accordion title="Delivery & Returns">
            <p className="whitespace-pre-line">{product.deliveryNote || DEFAULT_DELIVERY}</p>
          </Accordion>
        </div>

        {/* Prev / Next */}
        <div className="mt-20 grid grid-cols-2 gap-4 border-t border-border pt-8">
          <Link href={`/product/${prev.slug}`} className="text-left">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">← Previous</p>
            <p className="mt-2 font-sans text-xl">{prev.name}</p>
          </Link>
          <Link href={`/product/${next.slug}`} className="text-right">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Next →</p>
            <p className="mt-2 font-sans text-xl">{next.name}</p>
          </Link>
        </div>

        {/* Complete the Look */}
        <div className="mt-24">
          <h2 className="font-editorial text-3xl md:text-4xl">Complete the Look</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {allProducts
              .filter((p) => p.slug !== product.slug)
              .map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
          </div>
        </div>
      </div>

      {/* Mobile sticky Add-to-Cart / Reserve bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-sans">{product.price}</p>
        </div>
        <button
          onClick={toggleCart}
          aria-label={inCart ? "Remove from cart" : "Add to cart"}
          className={`rounded-full border p-3 active:scale-95 transition-transform ${
            inCart ? "border-foreground bg-foreground text-background" : "border-border text-foreground"
          }`}
        >
          {inCart ? <Check className="h-5 w-5" strokeWidth={1.75} /> : <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />}
        </button>
        <button
          onClick={primaryCta}
          className="rounded-full bg-foreground text-background px-5 py-3 text-xs uppercase tracking-[0.2em]"
        >
          {ctaLabel}
        </button>
      </div>

      {/* Zoom modal */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4"
          onClick={() => setZoom(null)}
        >
          <button className="absolute right-6 top-6 text-background" aria-label="Close">
            <X className="h-6 w-6" strokeWidth={1.5} />
          </button>
          <img src={zoom} alt="" className="max-h-[90vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}

      {/* Size guide modal */}
      {guideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-background p-8 border border-border">
            <button
              onClick={() => setGuideOpen(false)}
              className="absolute right-4 top-4"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <h3 className="font-editorial text-2xl">Size Guide</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Measurements in inches. Garment flat.
            </p>
            <table className="mt-6 w-full text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-normal">Size</th>
                  <th className="py-2 text-right font-normal">Chest</th>
                  <th className="py-2 text-right font-normal">Length</th>
                  <th className="py-2 text-right font-normal">Sleeve</th>
                  <th className="py-2 text-right font-normal">Shoulder</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_TABLE.map((r) => (
                  <tr key={r.size} className="border-b border-border/60">
                    <td className="py-3">{r.size}</td>
                    <td className="py-3 text-right tabular-nums">{r.chest}</td>
                    <td className="py-3 text-right tabular-nums">{r.length}</td>
                    <td className="py-3 text-right tabular-nums">{r.sleeve}</td>
                    <td className="py-3 text-right tabular-nums">{r.shoulder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
              Adab pieces are cut with a considered, relaxed fit. Choose your
              usual size, or size up for extra room.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-sans text-lg">{title}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
        />
      </button>
      {open && (
        <div className="pb-6 text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {children}
        </div>
      )}
    </div>
  );
}
