"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { createReservation } from "@/lib/actions/reservations";
import { ModalShell } from "./ModalShell";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().min(3, "Phone is required").max(40),
  email: z.string().trim().email("Invalid email").max(320),
});

type Props = {
  open: boolean;
  onClose: () => void;
  productSlug: string;
  productName: string;
  size: string;
  quantity: number;
  color?: string;
  price?: string;
};

export function ReservationDialog({
  open,
  onClose,
  productSlug,
  productName,
  size,
  quantity,
  color,
  price,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const close = () => {
    setDone(false);
    setOrderRef(null);
    setForm({ name: "", phone: "", email: "" });
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    const res = await createReservation({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      items: [{ product_slug: productSlug, size, quantity }],
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setOrderRef(res.orderRef);
    setDone(true);
  };

  return (
    <ModalShell open={open} onClose={close} labelledBy="reservation-modal-title" className="max-w-md">
      <button onClick={close} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" aria-label="Close">
        <X className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {done ? (
        <div className="p-7">
          <p className="font-display text-[11px] tracking-[0.24em] text-primary">RESERVATION RECEIVED</p>
          <h3 className="mt-3 font-editorial text-3xl leading-tight">Thank you.</h3>
          {orderRef && (
            <p className="mt-5 inline-block rounded-full border border-border bg-[color:var(--paper)] px-5 py-2 text-sm">
              Reference: <span className="font-display tracking-[0.12em] text-primary">{orderRef}</span>
            </p>
          )}
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Keep your reference. We'll confirm your reservation and payment details over WhatsApp/bKash within 24 hours.
          </p>
          <button
            onClick={close}
            className="mt-6 w-full rounded-full bg-foreground text-background py-3 text-xs uppercase tracking-[0.2em] hover:bg-foreground/85 transition-colors"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="p-7">
          <p className="font-display text-[11px] tracking-[0.24em] text-primary">FOUNDING DROP</p>
          <h3 id="reservation-modal-title" className="mt-2 font-editorial text-2xl leading-tight">
            Reserve your piece
          </h3>

          {/* Summary of the PDP selection — no re-picking */}
          <div className="mt-5 rounded-xl border border-border bg-[color:var(--paper)] p-4">
            <p className="font-sans text-base leading-tight">{productName}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {color ? `${color} · ` : ""}Size {size} · Qty {quantity}
            </p>
            {price && <p className="mt-2 text-sm tabular-nums">{price}</p>}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Advance payment secures your piece. We'll confirm details over WhatsApp/bKash within 24 hours.
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Phone (WhatsApp/bKash)">
              <input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputCls}
                placeholder="+8801…"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-foreground text-background py-3.5 text-xs uppercase tracking-[0.2em] hover:bg-foreground/85 transition-colors disabled:opacity-60"
          >
            {submitting ? "Reserving…" : "Reserve — Founding Drop"}
          </button>
        </form>
      )}
    </ModalShell>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
