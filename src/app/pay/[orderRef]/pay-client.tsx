"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { recordPayment } from "@/lib/actions/payments";
import { signUp } from "@/lib/auth-client";
import type { OrderItem } from "@/lib/queries";

const input =
  "w-full rounded-md border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition-colors";
const label = "font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground";

// Defined at module scope (NOT inside PayClient) so it keeps a stable identity
// across re-renders — otherwise every keystroke would remount the form and drop focus.
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg px-5 md:px-8 py-16 md:py-24">{children}</div>;
}

export function PayClient({
  orderRef,
  items,
  total,
  discount,
  hasPayment,
  alreadyProcessed,
  bkashNumber,
  email,
  name,
  canCreateAccount,
}: {
  orderRef: string;
  items: OrderItem[];
  total: number;
  discount?: { subtotal: number; pct: number; code: string | null } | null;
  hasPayment: boolean;
  alreadyProcessed: boolean;
  bkashNumber: string;
  email: string;
  name: string;
  canCreateAccount: boolean;
}) {
  const [payer, setPayer] = useState("");
  const [trxId, setTrxId] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Inline post-payment account creation (on the success screen).
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [creating, setCreating] = useState(false);
  const [accountDone, setAccountDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await recordPayment({ orderRef, bkashNumber: payer, trxId, marketingConsent: consent });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setDone(true);
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!agree) {
      toast.error("Please accept the privacy policy to continue.");
      return;
    }
    setCreating(true);
    try {
      // Land them on this order's status page once their email is verified.
      const { error } = await signUp.email({ name, email, password, callbackURL: `/account/orders/${orderRef}` });
      if (error) {
        toast.error(error.message ?? "Could not create your account.");
        return;
      }
      setAccountDone(true);
    } catch (err) {
      console.error("[pay] account creation failed", err);
      toast.error("Couldn't reach the server. Please try again.");
    } finally {
      setCreating(false);
    }
  };

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
    // After account creation: quiet "verify your email" confirmation.
    if (accountDone) {
      return (
        <Shell>
          <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Almost there</p>
          <h1 className="mt-3 font-editorial text-4xl">Check your email.</h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            We&rsquo;ve sent a verification link to <span className="text-foreground">{email}</span>. Confirm it to
            access your account and track order <span className="font-display tracking-[0.12em] text-primary">{orderRef}</span> any time.
          </p>
          <p className="mt-6 rounded-2xl border border-border bg-[color:var(--paper)] px-5 py-4 text-sm text-muted-foreground leading-relaxed">
            Your payment details are recorded — we&rsquo;ll verify them against bKash and message you on WhatsApp within 24 hours.
          </p>
          <Link href="/shop" className="mt-8 inline-block text-xs uppercase tracking-[0.2em] text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Continue browsing
          </Link>
        </Shell>
      );
    }

    // Account offered → make setting a password the focus of the screen.
    if (canCreateAccount) {
      return (
        <Shell>
          <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Payment received</p>
          <h1 className="mt-3 font-editorial text-4xl">One last step.</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Your payment details for <span className="font-display tracking-[0.1em] text-primary">{orderRef}</span> are recorded — we&rsquo;ll
            verify against bKash and message you on WhatsApp within 24 hours. Set a password to track it live.
          </p>

          {/* Hero: create account inline */}
          <div className="mt-7 rounded-2xl border border-primary/25 bg-[color:var(--paper)] p-6 shadow-sm ring-1 ring-primary/5 text-left">
            <h2 className="font-editorial text-2xl">Track your order.</h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Create your account to follow this order&rsquo;s status any time and check out faster next drop. Takes a few seconds.
            </p>
            <form onSubmit={createAccount} className="mt-5 space-y-3">
              <div>
                <label className={label} htmlFor="set-password">Choose a password</label>
                <input
                  id="set-password"
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`${input} mt-1.5`}
                />
              </div>
              <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                <span>
                  I agree to the{" "}
                  <Link href="/policies/privacy" className="underline underline-offset-2 hover:text-foreground" target="_blank">privacy policy</Link>.
                </span>
              </label>
              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-full bg-primary py-3.5 text-xs uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {creating ? "Creating account…" : "Create account & track order"}
              </button>
              <p className="text-center text-[11px] text-muted-foreground">Signing up as {email}</p>
            </form>
          </div>

          <Link href="/shop" className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Maybe later — continue browsing
          </Link>
        </Shell>
      );
    }

    // Already has an account → point them at the live status page.
    return (
      <Shell>
        <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Payment received</p>
        <h1 className="mt-3 font-editorial text-4xl">Response recorded.</h1>
        <p className="mt-5 inline-block rounded-full border border-border bg-[color:var(--paper)] px-5 py-2 text-sm">
          Reference: <span className="font-display tracking-[0.12em] text-primary">{orderRef}</span>
        </p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          We&rsquo;ve received your payment details and will verify them against bKash. We&rsquo;ll call or message
          you on WhatsApp within 24 hours to confirm. Thank you.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href={`/account/orders/${orderRef}`} className="inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background">
            View order status
          </Link>
          <Link href="/shop" className="text-xs uppercase tracking-[0.2em] text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Continue browsing
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Payment · Founding Drop</p>
      <h1 className="mt-3 font-editorial text-4xl">Complete your payment.</h1>

      {/* Amount + instructions */}
      <div className="mt-8 rounded-2xl border border-border p-6 paper-grain">
        {discount && discount.pct > 0 && (
          <div className="mb-3 space-y-1 border-b border-border/60 pb-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums line-through">৳ {discount.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-primary">
              <span>{discount.code ? `Code ${discount.code}` : "Discount"} · −{discount.pct}%</span>
              <span className="tabular-nums">− ৳ {(discount.subtotal - total).toLocaleString()}</span>
            </div>
          </div>
        )}
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
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>Email me about future ADAB drops. No spam — just the next release.</span>
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
