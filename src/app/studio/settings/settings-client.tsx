"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveLatestCount } from "@/lib/actions/settings";

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "text-xs uppercase tracking-[0.16em] text-muted-foreground";

export function SettingsClient({ latestCount }: { latestCount: number }) {
  const [count, setCount] = useState(String(latestCount));
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await saveLatestCount(count);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Settings saved");
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-5">
        <label className={labelCls} htmlFor="latest-count">Latest page — number of products</label>
        <p className="mt-1 text-xs text-muted-foreground">
          The newest pieces shown on the Latest page. If it resolves to a single product, visitors are
          taken straight to that product; more than one shows an index.
        </p>
        <input
          id="latest-count"
          type="number"
          min={1}
          max={50}
          className={`${inputCls} mt-3 max-w-[8rem]`}
          value={count}
          onChange={(e) => setCount(e.target.value)}
        />
      </div>

      <button
        onClick={save}
        disabled={pending}
        className="rounded-full bg-foreground px-6 py-2.5 text-sm text-background disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
