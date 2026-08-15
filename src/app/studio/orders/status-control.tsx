"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setPaymentStatus, setDeliveryStatus, setCancelled } from "@/lib/actions/admin";
import {
  PAYMENT_STEPS,
  DELIVERY_STEPS,
  PAYMENT_LABELS,
  DELIVERY_LABELS,
  PAYMENT_PILL,
  DELIVERY_PILL,
  deliveryEditable,
  type OrderAxes,
  type PaymentStatus,
  type DeliveryStatus,
} from "@/lib/order-status";

function Segmented<T extends string>({
  label,
  value,
  steps,
  labels,
  pills,
  disabled,
  pending,
  onPick,
}: {
  label: string;
  value: T;
  steps: readonly T[];
  labels: Record<T, string>;
  pills: Record<T, string>;
  disabled?: boolean;
  pending: boolean;
  onPick: (next: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className={`inline-flex flex-wrap gap-1.5 ${disabled ? "opacity-50" : ""}`}>
        {steps.map((s) => {
          const active = s === value;
          return (
            <button
              key={s}
              type="button"
              disabled={disabled || pending || active}
              onClick={() => onPick(s)}
              className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors disabled:cursor-default ${
                active
                  ? pills[s]
                  : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground disabled:hover:border-border disabled:hover:text-muted-foreground"
              }`}
            >
              {labels[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StatusControl({ orderRef, axes }: { orderRef: string; axes: OrderAxes }) {
  const router = useRouter();
  const [state, setState] = useState<OrderAxes>(axes);
  const [pending, startTransition] = useTransition();

  const run = (optimistic: OrderAxes, action: () => Promise<{ ok: boolean; error?: string }>, label: string) => {
    const prev = state;
    setState(optimistic);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setState(prev);
        toast.error(res.error ?? "Update failed.");
        return;
      }
      toast.success(`${orderRef} · ${label}`);
      router.refresh();
    });
  };

  const pickPayment = (p: PaymentStatus) =>
    run(
      { ...state, payment: p, delivery: p !== "paid" ? "not_delivered" : state.delivery },
      () => setPaymentStatus(orderRef, p),
      `payment ${PAYMENT_LABELS[p]}`,
    );

  const pickDelivery = (d: DeliveryStatus) =>
    run({ ...state, delivery: d }, () => setDeliveryStatus(orderRef, d), `delivery ${DELIVERY_LABELS[d]}`);

  const toggleCancel = () =>
    run({ ...state, cancelled: !state.cancelled }, () => setCancelled(orderRef, !state.cancelled), state.cancelled ? "restored" : "cancelled");

  return (
    <div className="flex flex-col gap-3">
      {state.cancelled && (
        <span className="inline-flex w-fit items-center rounded-full bg-destructive/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-destructive">
          Cancelled
        </span>
      )}
      <Segmented
        label="Payment"
        value={state.payment}
        steps={PAYMENT_STEPS}
        labels={PAYMENT_LABELS}
        pills={PAYMENT_PILL}
        disabled={state.cancelled}
        pending={pending}
        onPick={pickPayment}
      />
      <Segmented
        label="Delivery"
        value={state.delivery}
        steps={DELIVERY_STEPS}
        labels={DELIVERY_LABELS}
        pills={DELIVERY_PILL}
        disabled={!deliveryEditable(state)}
        pending={pending}
        onPick={pickDelivery}
      />
      <button
        type="button"
        onClick={toggleCancel}
        disabled={pending}
        className="w-fit text-[10px] uppercase tracking-[0.16em] text-muted-foreground underline underline-offset-4 hover:text-destructive disabled:opacity-50"
      >
        {state.cancelled ? "Restore order" : "Cancel order"}
      </button>
    </div>
  );
}
