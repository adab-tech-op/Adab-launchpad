"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { recordPayment } from "@/lib/actions/payments";
import type { OrderItem } from "@/lib/queries";

const input =
  "w-full rounded-md border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition-colors";
const label = "font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground";

export function PayClient({
  orderRef,
  items,
  total,
  hasPayment,
  alreadyProcessed,
  bkashNumber,
}: {
  orderRef: string;
  items: OrderItem[];
  total: number;
  hasPayment: boolean;
  alreadyProcessed: boolean;
  bkashNumber: string;
}) {
  const [payer, setPayer] = useState("");
  const [trxId, setTrxId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await recordPayment({ orderRef, bkashNumber: payer, trxId });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setDone(true);
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="mx-auto max-w-lg px-5 md:px-8 py-16 md:py-24">{children}</div>
  );

  if (alreadyProcessed) {
    return (
      <Shell>
        <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Payment</p>
        <h1 className="mt-3 font-editorial text-4xl">Already processed.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This order ({orderRef}) has already been handled. If you think this is a mistake, please contact us.
        </p>
        <Link href="/contact" className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background">
          Contact us
        </Link>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Payment</p>
        <h1 className="mt-3 font-editorial text-4xl">Response recorded.</h1>
        <p className="mt-5 inline-block rounded-full border border-border bg-[color:var(--paper)] px-5 py-2 text-sm">
          Reference: <span className="font-display tracking-[0.12em] text-primary">{orderRef}</span>
        </p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          We've received your payment details and will verify them against bKash. We'll call or message
          you on WhatsApp within 24 hours to confirm. Thank you.
        </p>
        <Link href="/shop" className="mt-8 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background">
          Continue browsing
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Payment · Founding Drop</p>
      <h1 className="mt-3 font-editorial text-4xl">Complete your payment.</h1>

      {/* Amount + instructions */}
      <div className="mt-8 rounded-2xl border border-border p-6 paper-grain">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Amount to send</span>
          <span className="font-editorial text-3xl tabular-nums">৳ {total.toLocaleString()}</span>
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm leading-relaxed">
            Open <strong>bKash</strong> → <strong>Send Money</strong> → send the amount above to:
          </p>
          <p className="mt-2 font-display text-2xl tracking-[0.08em] text-primary">
            {bkashNumber || "— our bKash number —"}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Then enter the number you paid from and your Transaction ID (TrxID) below.
          </p>
        </div>
      </div>

      {/* Order summary */}
      <div className="mt-4 rounded-2xl border border-border p-5 text-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Order {orderRef}</p>
        <ul className="mt-2 space-y-1">
          {items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>{it.name} <span className="text-muted-foreground">· {it.size} · ×{it.quantity}</span></span>
              <span className="tabular-nums text-muted-foreground">{it.price}</span>
            </li>
          ))}
        </ul>
      </div>

      {hasPayment && (
        <p className="mt-4 rounded-md bg-primary/10 px-4 py-3 text-xs text-primary leading-relaxed">
          You've already submitted payment details for this order. Submitting again will update them.
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">
          <span className={label}>bKash number you paid from</span>
          <input
            required
            inputMode="numeric"
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            className={input + " mt-2"}
            placeholder="01XXXXXXXXX"
          />
        </label>
        <label className="block">
          <span className={label}>Transaction ID (TrxID)</span>
          <input
            required
            value={trxId}
            onChange={(e) => setTrxId(e.target.value.toUpperCase())}
            className={input + " mt-2 uppercase"}
            placeholder="e.g. 9AB7CD2EF1"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-foreground py-3.5 text-xs uppercase tracking-[0.2em] text-background hover:bg-foreground/85 transition-colors disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit payment details"}
        </button>
        <p className="text-center text-[11px] text-muted-foreground">
          We verify every payment manually against bKash before confirming.
        </p>
      </form>
    </Shell>
  );
}
