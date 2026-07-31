"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, Undo2, X, ShoppingCart } from "lucide-react";
import { ModalShell } from "./ModalShell";
import { useCart } from "@/context/CartContext";

export function CartModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, setQty, removeItem } = useCart();

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="cart-modal-title" className="max-w-lg" from="right">
      <div className="relative flex items-center justify-center border-b border-border bg-background px-5 py-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
          <h2 id="cart-modal-title" className="font-display text-base tracking-wide">
            Your Cart
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close cart"
          className="absolute right-4 p-1.5 text-foreground transition-colors hover:text-primary"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="max-h-[45vh] overflow-y-auto bg-[color:var(--paper)] px-4 py-4 sm:max-h-[50vh]">
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-editorial text-2xl italic">Your cart is quiet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing reserved yet.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-background p-3"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[color:var(--paper)]">
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm">{item.name}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {item.color} · Size {item.size}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-3 rounded-full border border-border px-2.5 py-1">
                    <button onClick={() => setQty(item.id, item.qty - 1)} aria-label="Decrease quantity">
                      <Minus className="h-3 w-3" strokeWidth={1.5} />
                    </button>
                    <span className="w-4 text-center text-xs tabular-nums">{item.qty}</span>
                    <button onClick={() => setQty(item.id, item.qty + 1)} aria-label="Increase quantity">
                      <Plus className="h-3 w-3" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm tabular-nums">
                    ৳ {(item.price * item.qty).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border bg-[color:var(--paper)] px-4 py-4">
        {items.length > 0 && (
          <div className="mb-4 flex items-center justify-between px-1 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">৳ {subtotal.toLocaleString()}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full bg-muted px-5 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/70"
          >
            <Undo2 className="h-4 w-4" strokeWidth={1.5} />
            Continue Shopping
          </button>
          <Link
            href="/cart"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ShoppingCart className="h-4 w-4" strokeWidth={1.5} />
            Checkout
          </Link>
        </div>
      </div>
    </ModalShell>
  );
}
