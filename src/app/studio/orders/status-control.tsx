"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateOrderStatus } from "@/lib/actions/admin";

const STATUSES = ["pending", "confirmed", "paid", "shipped", "delivered", "cancelled"];

export function StatusControl({ orderRef, status }: { orderRef: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();

  const onChange = (next: string) => {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const res = await updateOrderStatus(orderRef, next);
      if (!res.ok) {
        setValue(prev);
        toast.error(res.error);
        return;
      }
      toast.success(`${orderRef} → ${next}`);
      router.refresh();
    });
  };

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs uppercase tracking-[0.14em] outline-none focus:border-primary disabled:opacity-60"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
