"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createWaitlistSignup } from "@/lib/actions/waitlist";

export function DropNotify({
  source = "drop_notify",
  productSlug,
  compact = false,
}: {
  source?: string;
  productSlug?: string;
  compact?: boolean;
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
    return <p className="text-sm text-muted-foreground">You&rsquo;re on the list — we&rsquo;ll email you when it drops.</p>;
  }

  return (
    <div className={`flex w-full gap-2 ${compact ? "max-w-xs" : "max-w-md"}`}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="you@email.com"
        className="min-w-0 flex-1 rounded-full border border-border bg-transparent px-4 py-2.5 text-sm outline-none focus:border-foreground"
      />
      <button
        onClick={submit}
        disabled={busy}
        className="shrink-0 rounded-full bg-foreground px-5 py-2.5 text-xs uppercase tracking-[0.12em] text-background disabled:opacity-50"
      >
        {busy ? "…" : "Notify me"}
      </button>
    </div>
  );
}
