"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, ChevronDown, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { type Product } from "@/data/products";
import { saleFor, formatPrice } from "@/lib/pricing";
import { type DropState, formatDhaka } from "@/lib/drop";
import { DropNotify } from "@/app/drop/drop-notify";
import { ProductCard } from "@/components/site/ProductCard";
import { WishlistButton } from "@/components/site/WishlistButton";
import { FabricCareModal } from "@/components/site/FabricCareModal";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import type { SizeGuideSettings, HandoverGuideSettings } from "@/lib/settings";
import type { FabricType } from "@/lib/fabrics";

// Feature flag: Founding Drop reservations vs. standard Add to Cart.
// Flip to false once fulfilment + cart checkout are live.
const dropModeActive = true;

// Standard copy for the Care accordion. Each product may override this from
// the studio form; when its field is blank we fall back to this. (Fit &
// Sizing and Delivery & Returns now open admin-editable popups instead — see
// sizeGuide / handoverGuide props.)
const DEFAULT_CARE =
  "Cold machine wash, inside out. Line dry in shade. Iron on medium with cloth in between.";

const SIZES = ["S", "M", "L", "XL", "XXL"];

export function ProductClient({
  product,
  allProducts,
  stock = {},
  fabricCare,
  fabric,
  sizeGuide,
  handoverGuide,
  dropState,
  dropBuyable = true,
  staffPreview = false,
}: {
  product: Product;
  allProducts: Product[];
  stock?: Record<string, number>;
  fabricCare?: string | null;
  fabric?: FabricType | null;
  sizeGuide: SizeGuideSettings;
  handoverGuide: HandoverGuideSettings;
  dropState?: DropState;
  dropBuyable?: boolean;
  staffPreview?: boolean;
}) {
  const router = useRouter();
  const { addItem, items, removeItem } = useCart();
  const soldOut = product.soldOut === true;
  const notYet = dropBuyable === false; // upcoming drop piece — not buyable yet
  const sale = saleFor(product.priceBdt ?? 0, product.discountPercent, product.discountUntil);
  const sizeAvailable = (s: string) => !soldOut && !(s in stock && stock[s] <= 0);
  const allOut = soldOut || SIZES.every((s) => s in stock && stock[s] <= 0);
  const [size, setSize] = useState(SIZES.find((s) => sizeAvailable(s)) ?? "L");
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(product.swatches[0]?.name ?? product.color);
  const [zoom, setZoom] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);

  const idx = allProducts.findIndex((p) => p.slug === product.slug);
  const prev = allProducts[(idx - 1 + allProducts.length) % allProducts.length];
  const next = allProducts[(idx + 1) % allProducts.length];

  const detailsList = product.details ?? [];

  const primaryCta = () => {
    if (allOut || !sizeAvailable(size) || notYet) return;
    if (dropModeActive) {
      router.push(
        `/checkout?slug=${product.slug}&size=${encodeURIComponent(size)}&color=${encodeURIComponent(color)}&qty=${qty}`,
      );
    } else {
      toggleCart();
    }
  };

  const ctaLabel = notYet
    ? product.dropDate
      ? `Drops ${formatDhaka(product.dropDate)}`
      : "Coming soon"
    : allOut
      ? "Sold out"
      : dropModeActive
        ? "Reserve your piece"
        : "Add to Cart";

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
        price: sale.onSale && product.priceBdt ? sale.salePrice : Number(product.price.replace(/[^0-9]/g, "")) || 0,
        image: product.images[0],
      });
      toast.success("Added to cart");
    }
  };

  return (
    <>
      {(staffPreview || dropState === "upcoming") && (
        <div className="bg-foreground px-5 py-2 text-center text-[11px] uppercase tracking-[0.06em] text-background">
          {staffPreview ? "Staff preview — hidden from customers" : "Upcoming"}
          {product.dropDate ? ` · drops ${formatDhaka(product.dropDate)}` : ""}
        </div>
      )}
      <div className="mx-auto max-w-7xl px-5 md:px-8 pt-6 md:pt-10">
        <nav className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
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
                {sale.onSale && product.priceBdt ? (
                  <p className="flex items-center gap-2 text-xl font-sans">
                    <span className="text-primary">{formatPrice(sale.salePrice)}</span>
                    <span className="text-base text-muted-foreground line-through">{formatPrice(sale.original)}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">−{sale.pct}%</span>
                  </p>
                ) : (
                  <p className="text-xl font-sans">{product.price}</p>
                )}
                {product.foundingNote && (
                  <p className="mt-1 text-xs text-primary uppercase tracking-[0.06em]">
                    {product.foundingNote}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
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
                  <p className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
                    Size
                  </p>
                  <button
                    onClick={() => setGuideOpen(true)}
                    className="text-xs uppercase tracking-[0.06em] text-foreground underline underline-offset-4"
                  >
                    Size guide
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {SIZES.map((s) => {
                    const avail = sizeAvailable(s);
                    return (
                      <button
                        key={s}
                        onClick={() => avail && setSize(s)}
                        disabled={!avail}
                        className={`rounded-md border py-2 text-sm transition-colors ${
                          size === s
                            ? "border-foreground bg-foreground text-background"
                            : avail
                              ? "border-border hover:border-foreground"
                              : "cursor-not-allowed border-border text-muted-foreground/40 line-through"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                {!allOut && size in stock && stock[size] > 0 && stock[size] <= 5 && (
                  <p className="mt-2 text-xs text-primary">Only {stock[size]} left in {size}.</p>
                )}
                {allOut && <p className="mt-2 text-xs text-muted-foreground">Sold out.</p>}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
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
                disabled={allOut || notYet}
                className="hidden lg:block w-full rounded-full py-4 text-xs uppercase tracking-[0.08em] bg-foreground text-background hover:bg-foreground/85 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                {ctaLabel}
              </button>

              {notYet && (
                <div className="hidden lg:block rounded-2xl border border-border p-4">
                  <p className="text-xs uppercase tracking-[0.05em] text-muted-foreground">
                    Not on sale yet{product.dropDate ? ` — drops ${formatDhaka(product.dropDate)}` : ""}. Get notified:
                  </p>
                  <div className="mt-3">
                    <DropNotify productSlug={product.slug} compact />
                  </div>
                </div>
              )}

              <div className="hidden lg:grid grid-cols-2 gap-3">
                <WishlistButton slug={product.slug} />
                <button
                  onClick={toggleCart}
                  className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-full border py-3.5 text-[11px] uppercase tracking-[0.05em] transition-colors active:scale-[0.98] ${
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
          <PopoverRow title="Fit & Sizing" onOpen={() => setGuideOpen(true)} />
          {!product.careNote && fabric ? (
            <PopoverRow title="Care Guide" onOpen={() => setCareOpen(true)} />
          ) : (
            <Accordion title="Care Guide">
              <p className="whitespace-pre-line">{product.careNote || fabricCare || DEFAULT_CARE}</p>
            </Accordion>
          )}
          <PopoverRow title="Delivery & Returns" onOpen={() => setHandoverOpen(true)} />
        </div>

        {/* Prev / Next */}
        <div className="mt-20 grid grid-cols-2 gap-4 border-t border-border pt-8">
          <Link href={`/product/${prev.slug}`} className="text-left">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">← Previous</p>
            <p className="mt-2 font-sans text-xl">{prev.name}</p>
          </Link>
          <Link href={`/product/${next.slug}`} className="text-right">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Next →</p>
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
          <p className="text-sm font-sans">{sale.onSale && product.priceBdt ? formatPrice(sale.salePrice) : product.price}</p>
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
          disabled={allOut || notYet}
          className="rounded-full bg-foreground text-background px-5 py-3 text-xs uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-40"
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

      {/* Size guide modal (Fit & Sizing) */}
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
            <h3 className="font-editorial text-2xl">{sizeGuide.title}</h3>
            {sizeGuide.note && <p className="mt-2 text-xs text-muted-foreground">{sizeGuide.note}</p>}
            <table className="mt-6 w-full text-sm">
              <thead className="text-xs uppercase tracking-[0.05em] text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-normal">Size</th>
                  {sizeGuide.columns.map((c) => (
                    <th key={c} className="py-2 text-right font-normal">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizeGuide.rows.map((r) => (
                  <tr key={r.size} className="border-b border-border/60">
                    <td className="py-3">{r.size}</td>
                    {r.values.map((v, i) => (
                      <td key={i} className="py-3 text-right tabular-nums">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {(product.fitNote || sizeGuide.footer) && (
              <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
                {product.fitNote || sizeGuide.footer}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Product Handover Guide modal (Delivery & Returns) */}
      {handoverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-background p-8 border border-border">
            <button
              onClick={() => setHandoverOpen(false)}
              className="absolute right-4 top-4"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <h3 className="font-editorial text-2xl">{handoverGuide.title}</h3>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.deliveryNote || handoverGuide.body}
            </p>
          </div>
        </div>
      )}
      {/* Fabric care popup (Care Guide) — same modal as the Care Guide page */}
      {fabric && <FabricCareModal fabric={careOpen ? fabric : null} onClose={() => setCareOpen(false)} />}
    </>
  );
}

// A row styled like Accordion but that opens a popup instead of expanding
// inline — used for FAQ-style entries backed by admin-editable content
// elsewhere on the site (size guide, handover guide, and future per-product
// FAQs). The outward-arrow badge signals "opens elsewhere" in place of the
// expand chevron.
function PopoverRow({ title, onOpen }: { title: string; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center justify-between border-b border-border py-5 text-left"
    >
      <span className="font-sans text-lg">{title}</span>
      <span className="flex items-center gap-1 text-muted-foreground" aria-hidden="true">
        <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
      </span>
    </button>
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
