"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { getProduct } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { createReservation } from "@/lib/actions/reservations";

const SIZES = ["S", "M", "L", "XL", "XXL"];
const priceNum = (s?: string) => Number((s ?? "").replace(/[^0-9]/g, "")) || 0;
const field =
  "w-full rounded-md border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition-colors";
const flabel = "font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground";

type Line = {
  slug: string;
  name: string;
  unitPrice: number;
  priceLabel: string;
  image: string;
  color?: string;
  sizes: Record<string, number>;
};

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().min(3, "Phone is required").max(40),
  email: z.string().trim().email("Enter a valid email").max(320),
  delivery_address: z.string().trim().max(1000).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export function CheckoutClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { items, hydrated, clear } = useCart();

  const slug = params.get("slug");
  const sizeParam = params.get("size");
  const colorParam = params.get("color") ?? undefined;
  const qtyParam = Math.max(1, Number(params.get("qty")) || 1);

  const [lines, setLines] = useState<Line[] | null>(null);
  const [fromCart, setFromCart] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", delivery_address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lines) return;
    if (slug) {
      const p = getProduct(slug);
      setLines(
        p
          ? [{
              slug,
              name: p.name,
              unitPrice: priceNum(p.price),
              priceLabel: p.price,
              image: p.images[0],
              color: colorParam,
              sizes: { [sizeParam || "L"]: qtyParam },
            }]
          : [],
      );
      setFromCart(false);
    } else if (hydrated) {
      const map = new Map<string, Line>();
      for (const it of items) {
        const p = getProduct(it.slug);
        if (!p) continue;
        if (!map.has(it.slug)) {
          map.set(it.slug, {
            slug: it.slug,
            name: p.name,
            unitPrice: priceNum(p.price),
            priceLabel: p.price,
            image: p.images[0],
            color: it.color,
            sizes: {},
          });
        }
        const line = map.get(it.slug)!;
        line.sizes[it.size] = (line.sizes[it.size] ?? 0) + it.qty;
      }
      setLines([...map.values()]);
      setFromCart(true);
    }
  }, [slug, sizeParam, colorParam, qtyParam, items, hydrated, lines]);

  const setSizeQty = (s: string, size: string, qty: number) => {
    setLines((prev) => prev?.map((l) => (l.slug === s ? { ...l, sizes: { ...l.sizes, [size]: Math.max(0, qty) } } : l)) ?? prev);
  };

  const lineUnits = (l: Line) => Object.values(l.sizes).reduce((s, q) => s + q, 0);
  const total = useMemo(() => (lines ?? []).reduce((sum, l) => sum + lineUnits(l) * l.unitPrice, 0), [lines]);
  const totalUnits = useMemo(() => (lines ?? []).reduce((sum, l) => sum + lineUnits(l), 0), [lines]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    if (totalUnits < 1) {
      toast.error("Add at least one item to continue.");
      return;
    }
    const orderItems: { product_slug: string; size: string; quantity: number }[] = [];
    for (const l of lines!) {
      for (const [size, qty] of Object.entries(l.sizes)) {
        if (qty > 0) orderItems.push({ product_slug: l.slug, size, quantity: qty });
      }
    }
    setSubmitting(true);
    const res = await createReservation({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      delivery_address: parsed.data.delivery_address || undefined,
      notes: parsed.data.notes || undefined,
      items: orderItems,
    });
    if (!res.ok) {
      setSubmitting(false);
      toast.error(res.error);
      return;
    }
    if (fromCart) clear();
    router.push(`/pay/${res.orderRef}`);
  };

  if (!lines) return <div className="min-h-[60vh]" />;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 md:px-8 py-24 text-center">
        <p className="font-editorial text-3xl italic text-muted-foreground">Nothing to check out.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background">
          Browse the Drop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 md:px-8 py-16 md:py-24">
      <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Checkout · Founding Drop</p>
      <h1 className="mt-3 font-editorial text-4xl md:text-5xl">Choose sizes &amp; quantities.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Set how many you want in each size. You can order the same piece in multiple sizes.
      </p>

      {/* Product lines */}
      <div className="mt-10 space-y-5">
        {lines.map((l) => (
          <div key={l.slug} className="rounded-2xl border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[color:var(--paper)]">
                <img src={l.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-lg leading-tight">{l.name}</p>
                {l.color && <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{l.color}</p>}
                <p className="mt-1 text-sm tabular-nums text-muted-foreground">{l.priceLabel} each</p>
              </div>
              <p className="shrink-0 text-sm tabular-nums">৳ {(lineUnits(l) * l.unitPrice).toLocaleString()}</p>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {SIZES.map((sz) => {
                const q = l.sizes[sz] ?? 0;
                return (
                  <div key={sz} className={`rounded-lg border p-2 text-center ${q > 0 ? "border-foreground" : "border-border"}`}>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{sz}</p>
                    <div className="mt-1.5 flex items-center justify-center gap-2">
                      <button type="button" onClick={() => setSizeQty(l.slug, sz, q - 1)} aria-label={`Fewer ${sz}`} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={q === 0}>
                        <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                      <span className="w-4 text-center text-sm tabular-nums">{q}</span>
                      <button type="button" onClick={() => setSizeQty(l.slug, sz, q + 1)} aria-label={`More ${sz}`} className="text-muted-foreground hover:text-foreground">
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-border p-5 paper-grain">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total · {totalUnits} piece{totalUnits === 1 ? "" : "s"}</span>
        <span className="font-editorial text-3xl tabular-nums">৳ {total.toLocaleString()}</span>
      </div>

      {/* Contact */}
      <form onSubmit={submit} className="mt-10 space-y-4">
        <h2 className="font-display text-xl">Your details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className={flabel}>Name</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field + " mt-2"} />
          </label>
          <label className="block">
            <span className={flabel}>Phone (call/WhatsApp)</span>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field + " mt-2"} placeholder="+8801…" />
          </label>
        </div>
        <label className="block">
          <span className={flabel}>Email</span>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field + " mt-2"} />
        </label>
        <label className="block">
          <span className={flabel}>Delivery address (optional)</span>
          <input value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} className={field + " mt-2"} />
        </label>
        <label className="block">
          <span className={flabel}>Notes (optional)</span>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={field + " mt-2"} />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-foreground py-4 text-xs uppercase tracking-[0.2em] text-background hover:bg-foreground/85 transition-colors disabled:opacity-60"
        >
          {submitting ? "Please wait…" : `Proceed to payment · ৳ ${total.toLocaleString()}`}
        </button>
        <p className="text-center text-[11px] text-muted-foreground">You'll get bKash payment instructions on the next step.</p>
      </form>
    </div>
  );
}
