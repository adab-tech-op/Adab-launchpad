"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, UploadCloud } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createFabricType, updateFabricType, deleteFabricType } from "@/lib/actions/fabrics";
import { CARE_SECTIONS, type FabricType } from "@/lib/fabrics";
import { HeroOverlayEditor } from "@/components/studio/HeroOverlayEditor";
import type { HeroOverlay } from "@/lib/hero";

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "font-display text-[11px] uppercase tracking-[0.06em] text-muted-foreground";

type Draft = {
  name: string;
  care_detail: string;
  thumbnail_url: string;
  details: string;
  washing: string;
  drying: string;
  ironing: string;
  storage: string;
  at_a_glance: string;
  overlay_enabled: boolean;
  overlay_color: string;
  overlay_opacity: number;
  overlay_from: string;
};

function draftFrom(f: Partial<FabricType>): Draft {
  return {
    name: f.name ?? "",
    care_detail: f.care_detail ?? "",
    thumbnail_url: f.thumbnail_url ?? "",
    details: f.details ?? "",
    washing: f.washing ?? "",
    drying: f.drying ?? "",
    ironing: f.ironing ?? "",
    storage: f.storage ?? "",
    at_a_glance: f.at_a_glance ?? "",
    overlay_enabled: f.overlay_enabled ?? true,
    overlay_color: f.overlay_color ?? "#26364A",
    overlay_opacity: f.overlay_opacity ?? 16,
    overlay_from: f.overlay_from ?? "solid",
  };
}

/** The card photo's tint, edited with the same control set as the heroes. */
function overlayOf(d: Draft): HeroOverlay {
  return {
    enabled: d.overlay_enabled,
    color: d.overlay_color,
    opacity: d.overlay_opacity,
    from: d.overlay_from as HeroOverlay["from"],
  };
}

function isDirty(a: Draft, b: Draft): boolean {
  return (Object.keys(a) as (keyof Draft)[]).some((k) => a[k] !== b[k]);
}

function Thumbnail({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const onFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file);
      onChange(uploaded);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="shrink-0">
      <label className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground hover:border-primary">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : uploading ? (
          <span className="text-[10px]">Uploading…</span>
        ) : (
          <UploadCloud className="h-5 w-5" strokeWidth={1.25} />
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
      </label>
    </div>
  );
}

function CareFields({ draft, set }: { draft: Draft; set: (patch: Partial<Draft>) => void }) {
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {CARE_SECTIONS.map(({ key, label }) => (
        <label key={key} className="block">
          <span className={labelCls}>{label}</span>
          <textarea
            className={`${inputCls} mt-1 resize-y`}
            rows={2}
            value={draft[key]}
            onChange={(e) => set({ [key]: e.target.value } as Partial<Draft>)}
          />
        </label>
      ))}
    </div>
  );
}

function FabricRow({ fabric }: { fabric: FabricType }) {
  const router = useRouter();
  const original = draftFrom(fabric);
  const [draft, setDraft] = useState<Draft>(original);
  const [pending, start] = useTransition();
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = isDirty(draft, original);

  const save = () =>
    start(async () => {
      const res = await updateFabricType(fabric.id, { ...draft, sort_order: fabric.sort_order });
      if (res.ok) { toast.success("Saved"); router.refresh(); }
      else toast.error(res.error);
    });

  const remove = () =>
    start(async () => {
      if (!confirm(`Delete "${fabric.name}"? Products using it will fall back to the standard care copy.`)) return;
      const res = await deleteFabricType(fabric.id);
      if (res.ok) { toast.success("Deleted"); router.refresh(); }
      else toast.error(res.error);
    });

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-start gap-4">
        <Thumbnail url={draft.thumbnail_url} onChange={(url) => set({ thumbnail_url: url })} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <input className={`${inputCls} font-medium`} value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            <button onClick={remove} disabled={pending} className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:text-red-600" aria-label="Delete fabric">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <label className="mt-3 block">
            <span className={labelCls}>Little details <span className="normal-case tracking-normal">(short card blurb)</span></span>
            <textarea className={`${inputCls} mt-1 resize-y`} rows={2} value={draft.details} onChange={(e) => set({ details: e.target.value })} />
          </label>
          <label className="mt-3 block">
            <span className={labelCls}>At a glance <span className="normal-case tracking-normal">(one line on the card)</span></span>
            <input
              className={`${inputCls} mt-1`}
              value={draft.at_a_glance}
              onChange={(e) => set({ at_a_glance: e.target.value })}
              placeholder="Hand wash cold · Dry flat in shade · Medium iron"
            />
          </label>
        </div>
      </div>

      <div className="mt-4">
        <HeroOverlayEditor
          value={overlayOf(draft)}
          onChange={(o) => set({ overlay_enabled: o.enabled, overlay_color: o.color, overlay_opacity: o.opacity, overlay_from: o.from })}
          previewImage={draft.thumbnail_url || undefined}
        />
      </div>

      <CareFields draft={draft} set={set} />

      <details className="mt-3">
        <summary className="cursor-pointer text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
          Legacy care note (shown inline on the product page, until the popup redesign)
        </summary>
        <textarea className={`${inputCls} mt-2 resize-y`} rows={3} value={draft.care_detail} onChange={(e) => set({ care_detail: e.target.value })} />
      </details>

      <button
        onClick={save}
        disabled={pending || !dirty}
        className="mt-3 rounded-full bg-foreground px-4 py-1.5 text-sm text-background disabled:opacity-40"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export function FabricsClient({ initial }: { initial: FabricType[] }) {
  const router = useRouter();
  const empty: Draft = draftFrom({});
  const [draft, setDraft] = useState<Draft>(empty);
  const [pending, start] = useTransition();
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const add = () =>
    start(async () => {
      const res = await createFabricType(draft);
      if (res.ok) {
        toast.success("Fabric added");
        setDraft(empty);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div className="space-y-6">
      {/* Add new */}
      <div className="rounded-xl border border-dashed border-border p-5">
        <p className={labelCls}>New fabric type</p>
        <div className="mt-2 flex items-start gap-4">
          <Thumbnail url={draft.thumbnail_url} onChange={(url) => set({ thumbnail_url: url })} />
          <div className="min-w-0 flex-1 space-y-2">
            <input className={inputCls} placeholder="Fabric name (e.g. Silk)" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            <textarea className={`${inputCls} resize-y`} rows={2} placeholder="Little details — short card blurb…" value={draft.details} onChange={(e) => set({ details: e.target.value })} />
          </div>
        </div>
        <CareFields draft={draft} set={set} />
        <button
          onClick={add}
          disabled={pending || draft.name.trim() === ""}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-1.5 text-sm text-background disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Add fabric
        </button>
      </div>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">No fabric types yet. Add your first above.</p>
      ) : (
        <div className="space-y-4">
          {initial.map((f) => (
            <FabricRow key={f.id} fabric={f} />
          ))}
        </div>
      )}
    </div>
  );
}
