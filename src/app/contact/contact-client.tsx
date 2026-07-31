"use client";

import { useState } from "react";
import { ChevronDown, Instagram } from "lucide-react";
import { toast } from "sonner";

const FAQ = [
  { q: "What does 'Adab' mean?", a: "[COPY] Final answer to come in Prompt 11." },
  { q: "What is a piran?", a: "[COPY] Final answer to come in Prompt 11." },
  { q: "How does the drop model work?", a: "[COPY] Final answer to come in Prompt 11." },
  { q: "What sizes do you carry?", a: "[COPY] Final answer to come in Prompt 11." },
  { q: "How do I pay?", a: "[COPY] Final answer to come in Prompt 11." },
  { q: "What's your return policy?", a: "[COPY] Final answer to come in Prompt 11." },
  { q: "Do you ship internationally?", a: "[COPY] Final answer to come in Prompt 11." },
];

export function ContactClient() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    orderNumber: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSubmitting(false);
    setForm({ name: "", email: "", orderNumber: "", message: "" });
    toast("Message sent. We'll get back to you within 24 hours.");
  };

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-24 md:py-32">
      <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">
        Contact
      </p>
      <h1 className="mt-4 font-display text-4xl md:text-5xl lg:text-6xl uppercase tracking-[0.08em]">
        Contact Adab
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
        Questions about a piece, an order, sizing, or the brand — we read every note.
      </p>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Name">
            <input
              required
              maxLength={80}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              maxLength={120}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Order number (optional)">
            <input
              maxLength={40}
              value={form.orderNumber}
              onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Message">
            <textarea
              required
              maxLength={1000}
              rows={6}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className={inputCls + " resize-none"}
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-primary px-8 py-3.5 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {submitting ? "Sending..." : "Submit"}
          </button>
        </form>

        <aside className="space-y-10">
          <div>
            <p className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Support
            </p>
            <a
              href="mailto:hello@adab.co"
              className="mt-2 block font-sans text-2xl text-foreground hover:text-primary transition-colors"
            >
              hello@adab.co
            </a>
          </div>
          <div>
            <p className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Studio
            </p>
            <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
              Dhaka, Bangladesh <br />
              By appointment only.
            </p>
          </div>
          <div>
            <p className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Follow
            </p>
            <a
              href="https://instagram.com/adab.co"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
            >
              <Instagram className="h-4 w-4" strokeWidth={1.5} />
              @adab.co
            </a>
          </div>
        </aside>
      </div>

      {/* FAQ */}
      <div className="mt-24 border-t border-border pt-16">
        <h2 className="font-display text-2xl md:text-3xl uppercase tracking-[0.08em]">
          Frequently asked
        </h2>
        <div className="mt-8 max-w-3xl">
          {FAQ.map((f) => (
            <FAQItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-sans text-lg">{q}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
        />
      </button>
      {open && <p className="pb-6 text-sm text-muted-foreground max-w-2xl leading-relaxed">{a}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
