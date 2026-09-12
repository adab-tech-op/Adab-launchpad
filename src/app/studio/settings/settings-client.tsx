"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { saveBanner, saveSizeGuide, saveHandoverGuide } from "@/lib/actions/settings";
import type { BannerSettings, SizeGuideSettings, HandoverGuideSettings } from "@/lib/settings";

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "text-xs uppercase tracking-[0.06em] text-muted-foreground";

function BannerEditor({ initial }: { initial: BannerSettings }) {
  const [b, setB] = useState<BannerSettings>(initial);
  const [pending, start] = useTransition();
  const set = <K extends keyof BannerSettings>(k: K, v: BannerSettings[K]) => setB((p) => ({ ...p, [k]: v }));

  const save = () =>
    start(async () => {
      const res = await saveBanner(b);
      if (res.ok) toast.success("Banner saved");
      else toast.error(res.error);
    });

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <span className={labelCls}>Top banner (Shop &amp; Drop)</span>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-primary" checked={b.enabled} onChange={(e) => set("enabled", e.target.checked)} />
          Show banner
        </label>
      </div>

      <div className="mt-4">
        <label className={labelCls} htmlFor="banner-text">Text</label>
        <input id="banner-text" className={`${inputCls} mt-1.5`} value={b.text} maxLength={160} onChange={(e) => set("text", e.target.value)} placeholder="Founding Drop — this price will not repeat." />
      </div>

      <div className="mt-4 flex gap-6">
        <div>
          <label className={labelCls} htmlFor="banner-bg">Background</label>
          <div className="mt-1.5 flex items-center gap-2">
            <input id="banner-bg" type="color" className="h-9 w-12 rounded border border-border bg-background" value={b.bgColor} onChange={(e) => set("bgColor", e.target.value)} />
            <input className={`${inputCls} max-w-[7rem] font-mono`} value={b.bgColor} onChange={(e) => set("bgColor", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="banner-fg">Text colour</label>
          <div className="mt-1.5 flex items-center gap-2">
            <input id="banner-fg" type="color" className="h-9 w-12 rounded border border-border bg-background" value={b.textColor} onChange={(e) => set("textColor", e.target.value)} />
            <input className={`${inputCls} max-w-[7rem] font-mono`} value={b.textColor} onChange={(e) => set("textColor", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <span className={labelCls}>Preview</span>
        <div className="mt-1.5 rounded-lg border border-border" style={{ backgroundColor: b.bgColor }}>
          <p className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em]" style={{ color: b.textColor }}>{b.text || "Banner text"}</p>
        </div>
      </div>

      <button onClick={save} disabled={pending} className="mt-5 rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50">
        {pending ? "Saving…" : "Save banner"}
      </button>
    </div>
  );
}

function SizeGuideEditor({ initial }: { initial: SizeGuideSettings }) {
  const [g, setG] = useState<SizeGuideSettings>(initial);
  const [pending, start] = useTransition();

  const setColumn = (i: number, v: string) => setG((p) => ({ ...p, columns: p.columns.map((c, ci) => (ci === i ? v : c)) }));
  const addColumn = () => setG((p) => ({ ...p, columns: [...p.columns, "New"], rows: p.rows.map((r) => ({ ...r, values: [...r.values, ""] })) }));
  const removeColumn = (i: number) =>
    setG((p) => ({ ...p, columns: p.columns.filter((_, ci) => ci !== i), rows: p.rows.map((r) => ({ ...r, values: r.values.filter((_, vi) => vi !== i) })) }));

  const setRowSize = (i: number, v: string) => setG((p) => ({ ...p, rows: p.rows.map((r, ri) => (ri === i ? { ...r, size: v } : r)) }));
  const setRowValue = (ri: number, vi: number, v: string) =>
    setG((p) => ({ ...p, rows: p.rows.map((r, i) => (i === ri ? { ...r, values: r.values.map((val, j) => (j === vi ? v : val)) } : r)) }));
  const addRow = () => setG((p) => ({ ...p, rows: [...p.rows, { size: "", values: p.columns.map(() => "") }] }));
  const removeRow = (i: number) => setG((p) => ({ ...p, rows: p.rows.filter((_, ri) => ri !== i) }));

  const save = () =>
    start(async () => {
      const res = await saveSizeGuide(g);
      if (res.ok) toast.success("Size guide saved");
      else toast.error(res.error);
    });

  return (
    <div className="rounded-xl border border-border p-5">
      <span className={labelCls}>Size guide (Fit &amp; Sizing popup)</span>

      <div className="mt-4">
        <label className={labelCls} htmlFor="size-guide-title">Title</label>
        <input id="size-guide-title" className={`${inputCls} mt-1.5`} value={g.title} onChange={(e) => setG((p) => ({ ...p, title: e.target.value }))} />
      </div>
      <div className="mt-3">
        <label className={labelCls} htmlFor="size-guide-note">Note (shown under the title)</label>
        <input id="size-guide-note" className={`${inputCls} mt-1.5`} value={g.note} onChange={(e) => setG((p) => ({ ...p, note: e.target.value }))} placeholder="Measurements in inches (US). Garment flat." />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr>
              <th className="pb-2 text-left text-[11px] uppercase tracking-[0.05em] text-muted-foreground">Size</th>
              {g.columns.map((c, i) => (
                <th key={i} className="pb-2 px-1">
                  <div className="flex items-center gap-1">
                    <input className={`${inputCls} text-xs`} value={c} onChange={(e) => setColumn(i, e.target.value)} />
                    <button onClick={() => removeColumn(i)} className="shrink-0 text-muted-foreground hover:text-red-600" aria-label={`Remove ${c} column`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="pb-2 pl-1">
                <button onClick={addColumn} className="text-muted-foreground hover:text-foreground" aria-label="Add column">
                  <Plus className="h-4 w-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {g.rows.map((r, ri) => (
              <tr key={ri}>
                <td className="py-1 pr-1">
                  <input className={`${inputCls} font-medium`} value={r.size} onChange={(e) => setRowSize(ri, e.target.value)} />
                </td>
                {r.values.map((v, vi) => (
                  <td key={vi} className="py-1 px-1">
                    <input className={inputCls} value={v} onChange={(e) => setRowValue(ri, vi, e.target.value)} />
                  </td>
                ))}
                <td className="py-1 pl-1">
                  <button onClick={() => removeRow(ri)} className="text-muted-foreground hover:text-red-600" aria-label={`Remove ${r.size || "row"}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addRow} className="mt-2 inline-flex items-center gap-1 text-xs uppercase tracking-[0.05em] text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Add size row
        </button>
      </div>

      <div className="mt-4">
        <label className={labelCls} htmlFor="size-guide-footer">Closing note</label>
        <textarea id="size-guide-footer" rows={2} className={`${inputCls} mt-1.5 resize-y`} value={g.footer} onChange={(e) => setG((p) => ({ ...p, footer: e.target.value }))} />
      </div>

      <button onClick={save} disabled={pending} className="mt-5 rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50">
        {pending ? "Saving…" : "Save size guide"}
      </button>
    </div>
  );
}

function HandoverGuideEditor({ initial }: { initial: HandoverGuideSettings }) {
  const [h, setH] = useState<HandoverGuideSettings>(initial);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      const res = await saveHandoverGuide(h);
      if (res.ok) toast.success("Handover guide saved");
      else toast.error(res.error);
    });

  return (
    <div className="rounded-xl border border-border p-5">
      <span className={labelCls}>Product Handover Guide (Delivery &amp; Returns popup)</span>
      <p className="mt-1 text-xs text-muted-foreground">A product's own delivery note (in its product form) overrides this.</p>

      <div className="mt-4">
        <label className={labelCls} htmlFor="handover-title">Title</label>
        <input id="handover-title" className={`${inputCls} mt-1.5`} value={h.title} onChange={(e) => setH((p) => ({ ...p, title: e.target.value }))} />
      </div>
      <div className="mt-3">
        <label className={labelCls} htmlFor="handover-body">Guide text</label>
        <textarea id="handover-body" rows={5} className={`${inputCls} mt-1.5 resize-y`} value={h.body} onChange={(e) => setH((p) => ({ ...p, body: e.target.value }))} />
      </div>

      <button onClick={save} disabled={pending} className="mt-5 rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50">
        {pending ? "Saving…" : "Save handover guide"}
      </button>
    </div>
  );
}

export function SettingsClient({
  banner,
  sizeGuide,
  handoverGuide,
}: {
  banner: BannerSettings;
  sizeGuide: SizeGuideSettings;
  handoverGuide: HandoverGuideSettings;
}) {
  return (
    <div className="space-y-8">
      <BannerEditor initial={banner} />
      <SizeGuideEditor initial={sizeGuide} />
      <HandoverGuideEditor initial={handoverGuide} />
    </div>
  );
}
