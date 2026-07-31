"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, X, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateOrderRef } from "@/lib/order-ref";
import { useCart } from "@/context/CartContext";

// PHASE 2: replace with real Shopify/payment-gateway checkout once Drop 01 sells and integration is ready.

const reservationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().min(3, "Phone is required").max(40),
  email: z.string().trim().email("Enter a valid email").max(320),
  delivery_address: z.string().trim().min(3, "Delivery address is required").max(1000),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export function CartClient() {
  const { items, setQty, removeItem, subtotal, clear } = useCart();

  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    delivery_address: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = reservationSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    if (items.length === 0) return;

    setSubmitting(true);
    const ref = generateOrderRef();
    const rows = items.map((i) => ({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      delivery_address: parsed.data.delivery_address,
      notes: parsed.data.notes || null,
      product_slug: i.slug,
      size: i.size,
      quantity: i.qty,
      order_ref: ref,
    }));

    const { error } = await supabase.from("reservations").insert(rows);
    setSubmitting(false);
    if (error) {
      toast.error("Could not save reservation. Please try again.");
      return;
    }
    clear();
    setOrderRef(ref);
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-24">
      <p className="text-[11px] uppercase tracking-[0.24em] text-primary font-display">Bag</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">Your cart</h1>

      {items.length === 0 && !submitted ? (
        <div className="mt-16 rounded-2xl border border-border p-12 text-center">
          <p className="font-editorial italic text-2xl">Your cart is quiet.</p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background"
          >
            Browse the Drop
          </Link>
        </div>
      ) : submitted ? (
        <div className="mt-16 rounded-2xl border border-border p-12 text-center paper-grain">
          <p className="font-editorial italic text-3xl">Reservation received.</p>
          {orderRef && (
            <p className="mt-5 inline-block rounded-full border border-border bg-background px-5 py-2 text-sm">
              Your reference:{" "}
              <span className="font-display tracking-[0.12em] text-primary">{orderRef}</span>
            </p>
          )}
          <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Keep this reference. We'll message you on WhatsApp/bKash within 24
            hours to confirm payment and secure your piece.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="divide-y divide-border border-y border-border">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[96px_1fr] md:grid-cols-[120px_1fr_auto] gap-5 py-6 items-start"
                >
                  <div className="aspect-[4/5] w-24 md:w-30 overflow-hidden rounded-xl bg-[color:var(--paper)]">
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg">{item.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {item.color} · Size {item.size}
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="inline-flex items-center gap-3 rounded-full border border-border px-3 py-1.5">
                        <button onClick={() => setQty(item.id, item.qty - 1)} aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <span className="w-5 text-center text-sm tabular-nums">{item.qty}</span>
                        <button onClick={() => setQty(item.id, item.qty + 1)} aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={1.5} /> Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-sm tabular-nums md:text-base md:col-start-3 md:row-start-1">
                    ৳ {(item.price * item.qty).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/shop"
              className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Continue Shopping
            </Link>
          </div>

          <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-border p-8 paper-grain">
            {!showForm ? (
              <>
                <h2 className="font-display text-xl">Summary</h2>
                <div className="mt-6 space-y-3 text-sm">
                  <Row label="Subtotal" value={`৳ ${subtotal.toLocaleString()}`} />
                  <Row label="Delivery" value="Calculated after reservation" muted />
                </div>
                <p className="mt-6 rounded-lg bg-primary/10 px-4 py-3 text-xs text-primary leading-relaxed">
                  Free delivery inside Dhaka on the Founding Drop. Nationwide
                  shipping confirmed at reservation.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-6 w-full rounded-full bg-primary py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:opacity-90 transition"
                >
                  Confirm Reservation
                </button>
                <p className="mt-4 text-center text-xs text-muted-foreground leading-relaxed">
                  Manual bKash confirmation. We'll message you within 24 hours.
                </p>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl">Your details</h2>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
                  >
                    Back
                  </button>
                </div>
                <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field label="Phone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <div>
                  <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Delivery Address
                  </label>
                  <textarea
                    value={form.delivery_address}
                    onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Notes (optional)
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-primary py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send Reservation"}
                </button>
              </form>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground" : "text-foreground tabular-nums"}>
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
      />
    </div>
  );
}
