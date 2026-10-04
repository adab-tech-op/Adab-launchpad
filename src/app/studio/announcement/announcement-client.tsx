"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveAnnouncement } from "@/lib/actions/announcement";
import { ANNOUNCEMENT_PAGES, type AnnouncementSettings, type Frequency } from "@/lib/announcement";

const FREQ_LABELS: Record<Frequency, string> = {
  once: "Once ever (per visitor)",
  session: "Once per session",
  always: "Every visit",
};

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "font-display text-[11px] uppercase tracking-[0.06em] text-muted-foreground";

export function AnnouncementEditor({ initial }: { initial: AnnouncementSettings }) {
  const router = useRouter();
  const [s, setS] = useState<AnnouncementSettings>(initial);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof AnnouncementSettings>(k: K, v: AnnouncementSettings[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const togglePage = (path: string) =>
    setS((prev) => ({
      ...prev,
      pages: prev.pages.includes(path) ? prev.pages.filter((p) => p !== path) : [...prev.pages, path],
    }));

  const save = () =>
    startTransition(async () => {
      const res = await saveAnnouncement(s);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Announcement saved");
      router.refresh();
    });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* The checkbox named the action, not the state, so answering "is this
            showing right now?" meant reading a tick. */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <p className="text-sm">{s.enabled ? "The popup is showing." : "The popup is off."}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {s.enabled
                ? s.pages.length === 0
                  ? "No pages selected, so nobody sees it. Pick at least one below."
                  : `On ${s.pages.length} page${s.pages.length === 1 ? "" : "s"}, ${FREQ_LABELS[s.frequency].toLowerCase()}.`
                : "Visitors see nothing until you turn it on."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => set("enabled", !s.enabled)}
            className={`shrink-0 rounded-full px-5 py-2 text-xs transition-opacity hover:opacity-90 ${
              s.enabled ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
            }`}
          >
            {s.enabled ? "On" : "Off"}
          </button>
        </div>

        <div>
          <label className={labelCls}>Eyebrow</label>
          <input className={`${inputCls} mt-1.5`} value={s.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} placeholder="Small label above the title" />
        </div>
        <div>
          <label className={labelCls}>Title</label>
          <input className={`${inputCls} mt-1.5`} value={s.title} onChange={(e) => set("title", e.target.value)} placeholder="Headline" />
        </div>
        <div>
          <label className={labelCls}>Body</label>
          <textarea className={`${inputCls} mt-1.5 resize-y`} rows={3} value={s.body} onChange={(e) => set("body", e.target.value)} placeholder="Supporting text" />
        </div>

        <div>
          <label className={labelCls}>Show on pages</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ANNOUNCEMENT_PAGES.map((p) => {
              const on = s.pages.includes(p.path);
              return (
                <button
                  key={p.path}
                  type="button"
                  onClick={() => togglePage(p.path)}
                  className={`rounded-full px-3.5 py-1.5 text-xs uppercase tracking-[0.05em] transition-colors ${
                    on ? "border border-foreground bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className={labelCls}>How often</label>
          <div className="mt-2 space-y-2">
            {(Object.keys(FREQ_LABELS) as Frequency[]).map((f) => (
              <label key={f} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="radio" name="frequency" checked={s.frequency === f} onChange={() => set("frequency", f)} className="h-4 w-4 accent-primary" />
                <span>{FREQ_LABELS[f]}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={pending || !s.title.trim()}
          className="rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.08em] text-white disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Live preview */}
      <div className="lg:sticky lg:top-24 h-fit">
        <p className={labelCls}>Preview</p>
        <div className={`mt-2 rounded-2xl border p-6 paper-grain ${s.enabled ? "border-border" : "border-dashed border-border opacity-50"}`}>
          {s.eyebrow && <p className="text-[11px] uppercase tracking-[0.08em] text-primary font-display">{s.eyebrow}</p>}
          <h3 className="mt-3 font-sans text-2xl leading-tight">{s.title || "Title"}</h3>
          {s.body && <p className="mt-3 text-sm text-muted-foreground">{s.body}</p>}
          <div className="mt-5 rounded-md bg-foreground py-2.5 text-center text-xs uppercase tracking-[0.06em] text-background">Notify Me</div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
          {s.enabled && s.pages.length === 0
            ? "Turned on, but no pages are selected, so this never appears."
            : "This is how it looks to a visitor."}
        </p>
      </div>
    </div>
  );
}
