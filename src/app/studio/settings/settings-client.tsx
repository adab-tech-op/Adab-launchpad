"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveBanner } from "@/lib/actions/settings";
import type { BannerSettings } from "@/lib/settings";

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "text-xs uppercase tracking-[0.06em] text-muted-foreground";

export function SettingsClient({ banner }: { banner: BannerSettings }) {
  const [b, setB] = useState<BannerSettings>(banner);
  const [pendingBanner, startBanner] = useTransition();
  const setBanner = <K extends keyof BannerSettings>(k: K, v: BannerSettings[K]) => setB((p) => ({ ...p, [k]: v }));

  const saveBannerSettings = () =>
    startBanner(async () => {
      const res = await saveBanner(b);
      if (res.ok) toast.success("Banner saved");
      else toast.error(res.error);
    });

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border p-5">
        <div className="flex items-center justify-between">
          <span className={labelCls}>Top banner (Shop &amp; Drop)</span>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={b.enabled} onChange={(e) => setBanner("enabled", e.target.checked)} />
            Show banner
          </label>
        </div>

        <div className="mt-4">
          <label className={labelCls} htmlFor="banner-text">Text</label>
          <input id="banner-text" className={`${inputCls} mt-1.5`} value={b.text} maxLength={160} onChange={(e) => setBanner("text", e.target.value)} placeholder="Founding Drop \u2014 this price will not repeat." />
        </div>

        <div className="mt-4 flex gap-6">
          <div>
            <label className={labelCls} htmlFor="banner-bg">Background</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input id="banner-bg" type="color" className="h-9 w-12 rounded border border-border bg-background" value={b.bgColor} onChange={(e) => setBanner("bgColor", e.target.value)} />
              <input className={`${inputCls} max-w-[7rem] font-mono`} value={b.bgColor} onChange={(e) => setBanner("bgColor", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="banner-fg">Text colour</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input id="banner-fg" type="color" className="h-9 w-12 rounded border border-border bg-background" value={b.textColor} onChange={(e) => setBanner("textColor", e.target.value)} />
              <input className={`${inputCls} max-w-[7rem] font-mono`} value={b.textColor} onChange={(e) => setBanner("textColor", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <span className={labelCls}>Preview</span>
          <div className="mt-1.5 rounded-lg border border-border" style={{ backgroundColor: b.bgColor }}>
            <p className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em]" style={{ color: b.textColor }}>{b.text || "Banner text"}</p>
          </div>
        </div>

        <button onClick={saveBannerSettings} disabled={pendingBanner} className="mt-5 rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50">
          {pendingBanner ? "Saving\u2026" : "Save banner"}
        </button>
      </div>
    </div>
  );
}
