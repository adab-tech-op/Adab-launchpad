"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createWaitlistSignup } from "@/lib/actions/waitlist";

export function DropNotify({
  source = "drop_notify",
  productSlug,
  compact = false,
  color,
}: {
  source?: string;
  productSlug?: string;
  compact?: boolean;
  /** On-image variant: field border/text follow this colour so the form stays
   *  readable over a dark hero. Omitted keeps the default page styling. */
  color?: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const e = email.trim();
    if (!e) return;
    setBusy(true);
    const res = await createWaitlistSignup({ email: e, source: productSlug ? `${source}:${productSlug}` : source });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <p className={`text-sm ${color ? "" : "text-muted-foreground"}`} style={color ? { color, opacity: 0.85 } : undefined}>
        You&rsquo;re on the list — we&rsquo;ll email you when it drops.
      </p>
    );
  }

  return (
    <div className={`flex w-full gap-2 ${compact ? "max-w-xs" : "max-w-md"}`}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="you@email.com"
        className={`min-w-0 flex-1 rounded-full border bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-current placeholder:opacity-60 ${color ? "" : "border-border focus:border-foreground"}`}
        style={color ? { color, borderColor: color } : undefined}
      />
      <button
        onClick={submit}
        disabled={busy}
        className="shrink-0 rounded-full bg-foreground px-5 py-2.5 text-xs uppercase tracking-[0.05em] text-background disabled:opacity-50"
      >
        {busy ? "…" : "Notify me"}
      </button>
    </div>
  );
}
