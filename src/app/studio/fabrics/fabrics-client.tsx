"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, UploadCloud, ChevronDown } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createFabricType, updateFabricType, deleteFabricType } from "@/lib/actions/fabrics";
import { CARE_SECTIONS, type FabricType } from "@/lib/fabrics";
import { HeroOverlayEditor } from "@/components/studio/HeroOverlayEditor";
import { overlayStyle, type HeroOverlay } from "@/lib/hero";
import { cldUrl, IMG_W } from "@/lib/image-url";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

type Draft = {
  name: string;
  care_detail: string;
  thumbnail_url: string;
  details: string;
  at_a_glance: string;
  washing: string;
  drying: string;
  ironing: string;
  storage: string;
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
    at_a_glance: f.at_a_glance ?? "",
    washing: f.washing ?? "",
    drying: f.drying ?? "",
    ironing: f.ironing ?? "",
    storage: f.storage ?? "",
    overlay_enabled: f.overlay_enabled ?? true,
    overlay_color: f.overlay_color ?? "#26364A",
    overlay_opacity: f.overlay_opacity ?? 16,
    overlay_from: f.overlay_from ?? "solid",
  };
}

const isDirty = (a: Draft, b: Draft) => (Object.keys(a) as (keyof Draft)[]).some((k) => a[k] !== b[k]);
const overlayOf = (d: Draft): HeroOverlay => ({
  enabled: d.overlay_enabled,
  color: d.overlay_color,
  opacity: d.overlay_opacity,
  from: d.overlay_from as HeroOverlay["from"],
});

/** A fabric with no care sections filled in shows nothing useful on any product
 *  assigned to it, but looked identical to a finished one. */
const careMissing = (d: Draft) => CARE_SECTIONS.every(({ key }) => !d[key].trim());

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Thumb({ url, onChange, size = "h-14 w-14" }: { url: string; onChange: (u: string) => void; size?: string }) {
  const [uploading, setUploading] = useState(false);
  const onFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadToCloudinary(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  return (
    <label className={`relative flex ${size} shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground hover:border-primary`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cldUrl(url, IMG_W.thumb)} alt="" className="h-full w-full object-cover" />
      ) : uploading ? (
        <span className="text-[10px]">Uploading…</span>
      ) : (
        <UploadCloud className="h-4 w-4" strokeWidth={1.25} />
      )}
      <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
    </label>
  );
}

function CareFields({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CARE_SECTIONS.map(({ key, label }) => (
        <Field key={key} label={label}>
          {/* Three-line boxes holding paragraphs meant scrolling inside a
              scroll to read your own copy. */}
          <textarea
            className={`${inputCls} min-h-[5.5rem] resize-y`}
            value={draft[key]}
            onChange={(e) => set({ [key]: e.target.value } as Partial<Draft>)}
          />
        </Field>
      ))}
    </div>
  );
}

function FabricRow({ fabric, usedBy, open, onToggle }: { fabric: FabricType; usedBy: number; open: boolean; onToggle: () => void }) {
  const router = useRouter();
  const original = draftFrom(fabric);
  const [draft, setDraft] = useState<Draft>(original);
  const [pending, start] = useTransition();
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = isDirty(draft, original);
  const incomplete = careMissing(draft);
  const ov = overlayStyle(overlayOf(draft));

  const save = () =>
    start(async () => {
      const res = await updateFabricType(fabric.id, { ...draft, sort_order: fabric.sort_order });
      if (res.ok) {
        toast.success("Saved");
        router.refresh();
      } else toast.error(res.error);
    });

  const remove = () =>
    start(async () => {
      const warn =
        usedBy > 0
          ? `Delete "${fabric.name}"? ${usedBy} product${usedBy === 1 ? "" : "s"} will lose this care guide and fall back to the standard copy.`
          : `Delete "${fabric.name}"?`;
      if (!confirm(warn)) return;
      const res = await deleteFabricType(fabric.id);
      if (res.ok) {
        toast.success("Deleted");
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div className={`border-t border-border ${open ? "bg-primary/[0.03]" : ""}`}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="grid w-full grid-cols-1 items-center gap-3 px-4 py-3.5 text-left lg:grid-cols-[54px_1fr_230px_150px_28px] lg:gap-4"
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
          {fabric.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cldUrl(fabric.thumbnail_url, IMG_W.thumb)} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="text-sm">{fabric.name}</p>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{draft.details || "No blurb yet"}</p>
        </div>
        <span className={`text-xs ${incomplete ? "text-destructive" : ""}`}>
          {incomplete ? "Care not filled in" : draft.at_a_glance || "No at-a-glance line"}
        </span>
        <span className={`text-xs ${usedBy === 0 ? "text-muted-foreground" : ""}`}>
          {usedBy === 0 ? "No products yet" : `${usedBy} product${usedBy === 1 ? "" : "s"}`}
        </span>
        <ChevronDown
          className={`h-4 w-4 justify-self-end text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-6 px-4 pb-5 lg:grid-cols-[280px_1fr]">
          <div>
            <p className="mb-1 text-[11px] text-muted-foreground">How the card looks</p>
            <div className="flex overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative w-24 shrink-0 bg-muted">
                {fabric.thumbnail_url && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cldUrl(fabric.thumbnail_url, IMG_W.preview)} alt="" className="h-full w-full object-cover" />
                    {ov && <div className="absolute inset-0" style={ov} />}
                  </>
                )}
              </div>
              <div className="min-w-0 p-3">
                <p className="text-sm">{draft.name || "Untitled"}</p>
                <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">{draft.details}</p>
                {draft.at_a_glance && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{draft.at_a_glance}</p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Thumb url={draft.thumbnail_url} onChange={(u) => set({ thumbnail_url: u })} />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {draft.thumbnail_url ? "Replace the image" : "Upload an image for this fabric"}
              </p>
            </div>

            {/* Overlay settings do nothing without an image, so they wait for
                one rather than offering controls that change nothing. */}
            {draft.thumbnail_url ? (
              <div className="mt-3">
                <HeroOverlayEditor
                  value={overlayOf(draft)}
                  onChange={(o) =>
                    set({
                      overlay_enabled: o.enabled,
                      overlay_color: o.color,
                      overlay_opacity: o.opacity,
                      overlay_from: o.from,
                    })
                  }
                  previewImage={draft.thumbnail_url}
                />
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
                Overlay settings appear once there is an image to tint.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Name">
                <input className={inputCls} value={draft.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="At a glance, one line on the card">
                <input
                  className={inputCls}
                  value={draft.at_a_glance}
                  onChange={(e) => set({ at_a_glance: e.target.value })}
                  placeholder="Machine wash cold · Shade dry · Medium iron"
                />
              </Field>
            </div>

            <Field label="Little details, the card blurb">
              <textarea className={`${inputCls} min-h-[3.5rem] resize-y`} value={draft.details} onChange={(e) => set({ details: e.target.value })} />
            </Field>

            <CareFields draft={draft} set={set} />

            <details>
              <summary className="cursor-pointer text-[11px] text-muted-foreground">
                Legacy care note, shown inline on products with no care override
              </summary>
              <textarea
                className={`${inputCls} mt-2 min-h-[4rem] resize-y`}
                value={draft.care_detail}
                onChange={(e) => set({ care_detail: e.target.value })}
              />
            </details>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={save}
                disabled={pending || !dirty}
                className="rounded-full bg-primary px-5 py-2 text-xs text-primary-foreground disabled:opacity-40"
              >
                {pending ? "Saving…" : dirty ? "Save" : "Saved"}
              </button>
              <span className="text-[11px] text-muted-foreground">
                Changes show in the Care Guide and on every product using {draft.name || "this fabric"}.
              </span>
              <button
                onClick={remove}
                disabled={pending}
                className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FabricsClient({ initial, usage }: { initial: FabricType[]; usage: Record<number, number> }) {
  const router = useRouter();
  const empty = draftFrom({});
  const [draft, setDraft] = useState<Draft>(empty);
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const add = () =>
    start(async () => {
      const res = await createFabricType(draft);
      if (res.ok) {
        toast.success("Fabric added");
        setDraft(empty);
        setAdding(false);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.06em] text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> {adding ? "Close" : "Add a fabric"}
        </button>
      </div>

      {adding && (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name">
              <input className={inputCls} placeholder="Silk" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="At a glance">
              <input className={inputCls} value={draft.at_a_glance} onChange={(e) => set({ at_a_glance: e.target.value })} />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Little details">
              <textarea className={`${inputCls} min-h-[3.5rem] resize-y`} value={draft.details} onChange={(e) => set({ details: e.target.value })} />
            </Field>
          </div>
          <div className="mt-3">
            <CareFields draft={draft} set={set} />
          </div>
          <button
            onClick={add}
            disabled={pending || !draft.name.trim()}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-xs text-primary-foreground disabled:opacity-40"
          >
            {pending ? "Adding…" : "Add fabric"}
          </button>
        </div>
      )}

      {initial.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No fabric types yet. Add your first above.</p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
          <div className="hidden grid-cols-[54px_1fr_230px_150px_28px] gap-4 bg-primary px-4 py-3 text-xs text-primary-foreground/80 lg:grid">
            <span />
            <span>Fabric</span>
            <span>At a glance</span>
            <span>Used by</span>
            <span />
          </div>
          {initial.map((f) => (
            <FabricRow
              key={f.id}
              fabric={f}
              usedBy={usage[f.id] ?? 0}
              open={openId === f.id}
              onToggle={() => setOpenId(openId === f.id ? null : f.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
