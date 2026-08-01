"use client";

import Link from "next/link";
import { Minus, Plus, X, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function CartClient() {
  const { items, setQty, removeItem, subtotal } = useCart();

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-24">
      <p className="text-[11px] uppercase tracking-[0.24em] text-primary font-display">Bag</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-border p-12 text-center">
          <p className="font-editorial italic text-2xl">Your cart is quiet.</p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background"
          >
            Browse the Drop
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
            <h2 className="font-display text-xl">Summary</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground tabular-nums">৳ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-muted-foreground">Confirmed at checkout</span>
              </div>
            </div>
            <p className="mt-6 rounded-lg bg-primary/10 px-4 py-3 text-xs text-primary leading-relaxed">
              Free delivery inside Dhaka on the Founding Drop. Nationwide shipping confirmed at checkout.
            </p>
            <Link
              href="/checkout"
              className="mt-6 block w-full rounded-full bg-primary py-4 text-center text-xs uppercase tracking-[0.2em] text-primary-foreground hover:opacity-90 transition"
            >
              Checkout
            </Link>
            <p className="mt-4 text-center text-xs text-muted-foreground leading-relaxed">
              Choose sizes &amp; quantities next, then bKash payment.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
