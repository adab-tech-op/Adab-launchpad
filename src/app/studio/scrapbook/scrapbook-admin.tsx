"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, UploadCloud } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { addScrapbookImage, updateScrapbookImage, deleteScrapbookImage } from "@/lib/actions/scrapbook";
import { SCRAPBOOK_KINDS, SCRAPBOOK_SPANS, type ScrapbookImage, type ScrapbookKind, type ScrapbookSpan } from "@/lib/scrapbook";
import { UploadHint } from "@/components/studio/UploadHint";

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

type Draft = {
  caption: string;
  caption_bn: string;
  place: string;
  taken_on: string;
  credit: string;
  kind: ScrapbookKind;
  span: ScrapbookSpan;
  group_label: string;
  col_start: string;
  col_span: string;
  nudge_y: string;
  rotation: string;
  sort_order: string;
};

function draftOf(img: ScrapbookImage): Draft {
  return {
    caption: img.caption,
    caption_bn: img.caption_bn,
    place: img.place,
    taken_on: img.taken_on,
    credit: img.credit,
    kind: img.kind,
    span: img.span,
    group_label: img.group_label,
    col_start: String(img.col_start),
    col_span: String(img.col_span),
    nudge_y: String(img.nudge_y),
    rotation: String(img.rotation),
    sort_order: String(img.sort_order),
  };
}

function Tile({ img }: { img: ScrapbookImage }) {
  const router = useRouter();
  const original = draftOf(img);
  const [d, setD] = useState<Draft>(original);
  const set = (patch: Partial<Draft>) => setD((p) => ({ ...p, ...patch }));
  const [pending, start] = useTransition();
  const dirty = (Object.keys(original) as (keyof Draft)[]).some((k) => d[k] !== original[k]);

  const save = () =>
    start(async () => {
      const res = await updateScrapbookImage(img.id, d);
      if (res.ok) { toast.success("Saved"); router.refresh(); }
      else toast.error(res.error);
    });

  const remove = () =>
    start(async () => {
      if (!confirm("Remove this image from the scrapbook?")) return;
      const res = await deleteScrapbookImage(img.id);
      if (res.ok) { toast.success("Removed"); router.refresh(); }
      else toast.error(res.error);
    });

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.image_url} alt={img.caption || "scrapbook"} className="aspect-square w-full object-cover" />
      <div className="space-y-2 p-3">
        <input className={inputCls} value={d.caption} onChange={(e) => set({ caption: e.target.value })} placeholder="Caption — English" />
        <input className={inputCls} value={d.caption_bn} onChange={(e) => set({ caption_bn: e.target.value })} placeholder="ক্যাপশন — বাংলা (optional)" />
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} value={d.place} onChange={(e) => set({ place: e.target.value })} placeholder="Place" />
          <input className={inputCls} value={d.taken_on} onChange={(e) => set({ taken_on: e.target.value })} placeholder="When — e.g. March 2026" />
        </div>
        <input className={inputCls} value={d.credit} onChange={(e) => set({ credit: e.target.value })} placeholder="Credit — Rafi, or @handle (submitted moments)" />
        <div className="grid grid-cols-2 gap-2">
          <select className={inputCls} value={d.kind} onChange={(e) => set({ kind: e.target.value as ScrapbookKind })} aria-label="Tile kind">
            {SCRAPBOOK_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <select className={inputCls} value={d.span} onChange={(e) => set({ span: e.target.value as ScrapbookSpan })} aria-label="Tile size">
            {SCRAPBOOK_SPANS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {SCRAPBOOK_KINDS.find((k) => k.value === d.kind)?.hint}
        </p>
        <input className={inputCls} value={d.group_label} onChange={(e) => set({ group_label: e.target.value })} placeholder="Group — e.g. Drop 01" />

        {/* Desktop board placement. Tablet and mobile ignore these and fall
            back to sort order, so a card can never cover a caption there. */}
        <details>
          <summary className="cursor-pointer text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
            Placement on the board (desktop)
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[11px] text-muted-foreground">Column (0–11)</span>
              <input className={inputCls} type="number" min={0} max={11} value={d.col_start} onChange={(e) => set({ col_start: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-[11px] text-muted-foreground">Width (2–12)</span>
              <input className={inputCls} type="number" min={2} max={12} value={d.col_span} onChange={(e) => set({ col_span: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-[11px] text-muted-foreground">Nudge up/down (px)</span>
              <input className={inputCls} type="number" min={-240} max={240} step={10} value={d.nudge_y} onChange={(e) => set({ nudge_y: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-[11px] text-muted-foreground">Tilt (−4 to 4°)</span>
              <input className={inputCls} type="number" min={-4} max={4} step={0.1} value={d.rotation} onChange={(e) => set({ rotation: e.target.value })} />
            </label>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Negative nudge pulls a card up so it tucks under its neighbour — that overlap is what makes the board
            feel pinned rather than gridded. Column + width must stay within 12.
          </p>
        </details>
        <div className="flex items-center gap-2">
          <input className={`${inputCls} w-20`} type="number" min={0} value={d.sort_order} onChange={(e) => set({ sort_order: e.target.value })} aria-label="Sort order" />
          <button onClick={save} disabled={pending || !dirty} className="rounded-full bg-foreground px-4 py-1.5 text-sm text-background disabled:opacity-40">
            {pending ? "…" : "Save"}
          </button>
          <button onClick={remove} disabled={pending} className="ml-auto rounded-lg border border-border p-2 text-muted-foreground hover:text-red-600" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScrapbookAdmin({ initial }: { initial: ScrapbookImage[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadToCloudinary(file);
        const res = await addScrapbookImage({ image_url: url, caption: "" });
        if (!res.ok) { toast.error(res.error); break; }
      }
      toast.success("Uploaded");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-5 text-sm hover:border-primary">
        <UploadCloud className="h-5 w-5 text-muted-foreground" />
        <span>{uploading ? "Uploading…" : "Upload image(s)"}</span>
        <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => onUpload(e.target.files)} />
      </label>
      <UploadHint spec="scrapbook" className="-mt-3" />

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">No images yet. Upload the first above.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {initial.map((img) => (
            <Tile key={img.id} img={img} />
          ))}
        </div>
      )}
    </div>
  );
}
