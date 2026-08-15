"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { ModalShell } from "@/components/site/ModalShell";
import { sendPaymentConfirmation } from "@/lib/actions/admin";

export function ConfirmPaymentButton({
  orderRef,
  amount,
  trxId,
  bkashNumber,
  sentAt,
  confirmedBy,
}: {
  orderRef: string;
  amount: number;
  trxId: string | null;
  bkashNumber: string | null;
  sentAt: string | null;
  confirmedBy: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pending, startTransition] = useTransition();

  // Already sent — show a settled state, no button.
  if (sentAt) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
        Confirmation sent{confirmedBy ? ` by ${confirmedBy}` : ""} ·{" "}
        {new Date(sentAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
      </p>
    );
  }

  const close = () => {
    if (pending) return;
    setOpen(false);
    setChecked(false);
  };

  const send = () => {
    startTransition(async () => {
      const res = await sendPaymentConfirmation(orderRef);
      if (!res.ok) {
        toast.error(res.error);
        return; // leave dialog open so they can retry; slot was released server-side
      }
      toast.success(`Payment confirmation sent · ${orderRef}`);
      setOpen(false);
      setChecked(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-primary px-4 py-2 text-xs uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-90"
      >
        Send payment confirmation
      </button>

      <ModalShell open={open} onClose={close} labelledBy="confirm-title" className="max-w-lg">
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
              <AlertTriangle className="h-4.5 w-4.5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 id="confirm-title" className="font-editorial text-2xl">Confirm this payment?</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                This sends the customer a <strong className="text-foreground">payment-confirmed</strong> email —
                it tells them their order is verified and secured. Send it <strong className="text-foreground">only</strong> after
                you&rsquo;ve checked this transaction against your bKash statement. It can be sent once.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Verify against bKash</p>
            <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">TrxID</p>
                <p className="font-medium">{trxId ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Amount</p>
                <p className="tabular-nums">৳ {amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Paid from</p>
                <p className="tabular-nums">{bkashNumber ?? "—"}</p>
              </div>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>I have verified this payment in bKash and the TrxID and amount match.</span>
          </label>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={!checked || pending}
              className="rounded-full bg-primary px-5 py-2 text-xs uppercase tracking-[0.16em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Sending…" : "Send confirmation"}
            </button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}
