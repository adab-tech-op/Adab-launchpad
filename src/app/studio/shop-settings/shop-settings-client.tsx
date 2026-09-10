"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveDropWindowDays, saveAllowMultiOrder } from "@/lib/actions/settings";

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "text-xs uppercase tracking-[0.06em] text-muted-foreground";

export function ShopSettingsClient({ dropWindow, allowMulti }: { dropWindow: number; allowMulti: boolean }) {
  const [win, setWin] = useState(String(dropWindow));
  const [multi, setMulti] = useState(allowMulti);
  const [pendingWin, startWin] = useTransition();
  const [pendingMulti, startMulti] = useTransition();

  const toggleMulti = (next: boolean) =>
    startMulti(async () => {
      setMulti(next);
      const res = await saveAllowMultiOrder(next);
      if (res.ok) toast.success("Saved");
      else { toast.error(res.error); setMulti(!next); }
    });

  const saveWindow = () =>
    startWin(async () => {
      const res = await saveDropWindowDays(win);
      if (res.ok) toast.success("Saved");
      else toast.error(res.error);
    });

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border p-5">
        <label className={labelCls} htmlFor="drop-window">Drop window — days before a drop it turns &ldquo;Upcoming&rdquo;</label>
        <p className="mt-1 text-xs text-muted-foreground">
          A scheduled product stays hidden until this many days before its drop date, then shows as
          &ldquo;Upcoming&rdquo; on the Drop page (still not buyable) until the drop time.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input id="drop-window" type="number" min={1} max={60} className={`${inputCls} max-w-[8rem]`} value={win} onChange={(e) => setWin(e.target.value)} />
          <button onClick={saveWindow} disabled={pendingWin} className="rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50">
            {pendingWin ? "Saving\u2026" : "Save"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border p-5">
        <div className="flex items-center justify-between">
          <span className={labelCls}>Ordering</span>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={multi} disabled={pendingMulti} onChange={(e) => toggleMulti(e.target.checked)} />
            Allow multiple items per order
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Off (default): one product / one size per order — the standard drop rule. Turn on for occasional
          offers where customers may combine several pieces in a single order.
        </p>
      </div>
    </div>
  );
}
