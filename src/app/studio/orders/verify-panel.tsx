"use client";

import { useState } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";
import { amountCheck, payerCheck, type Check as VerifyCheck } from "@/lib/payment-verify";

function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked; the value is still on screen to read */
        }
      }}
      aria-label={`Copy ${label}`}
      className="inline-flex items-center gap-1.5 text-left hover:text-primary"
    >
      <span className="tabular-nums">{value}</span>
      {copied ? <Check className="h-3 w-3 text-emerald-700" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </button>
  );
}

function Note({ check }: { check: VerifyCheck | null }) {
  if (!check) return null;
  return (
    <p className={`mt-1 text-[11px] leading-relaxed ${check.ok ? "text-emerald-700" : "text-destructive"}`}>
      {check.note}
    </p>
  );
}

/**
 * The verification block.
 *
 * These four values existed before; what they meant together did not. The
 * amount is compared against the items total and the payer number against the
 * customer's, so the comparing is done rather than left to the eye — the two
 * phone numbers are stored in different formats, which makes eyeballing them
 * genuinely error-prone.
 */
export function VerifyPanel({
  expected,
  itemsTotal,
  paidFrom,
  customerPhone,
  trxId,
  submittedAt,
  redacted,
}: {
  expected: number;
  itemsTotal: number;
  paidFrom: string;
  customerPhone: string | null;
  trxId: string;
  submittedAt: string;
  /** Moderators see masked values, so there is nothing to copy or compare. */
  redacted: boolean;
}) {
  const amount = redacted ? null : amountCheck(expected, itemsTotal);
  const payer = redacted ? null : payerCheck(paidFrom, customerPhone);

  return (
    <div
      className={`mt-4 rounded-xl border p-4 text-sm ${
        amount && !amount.ok ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/5"
      }`}
    >
      <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.06em] text-primary">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Check this against your bKash statement
      </p>

      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Amount</p>
          <p className="tabular-nums">৳ {expected.toLocaleString()}</p>
          <Note check={amount} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Paid from</p>
          {redacted ? <p className="tabular-nums">{paidFrom}</p> : <CopyValue value={paidFrom} label="payer number" />}
          <Note check={payer} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">TrxID</p>
          {redacted ? <p className="font-medium">{trxId}</p> : <CopyValue value={trxId} label="transaction id" />}
          <p className="mt-1 text-[11px] text-muted-foreground">
            Submitted{" "}
            {new Date(submittedAt).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
