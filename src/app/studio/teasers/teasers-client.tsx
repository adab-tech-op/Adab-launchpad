"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { UploadHint } from "@/components/studio/UploadHint";
import { saveTeaser, deleteTeaser, toggleTeaser } from "@/lib/actions/teasers";
import type { Teaser } from "@/lib/teasers";
import { cldUrl, IMG_W } from "@/lib/image-url";

const inputCls = "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground";
const blank: Partial<Teaser> = { label: "", subtext: "", imageUrl: "", sortOrder: 0, active: false };

export function TeasersClient({ initial }: { initial: Teaser[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<Teaser> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      const res = await saveTeaser(editing);
      if (res.ok) { toast.success("Saved"); setEditing(null); router.refresh(); }
      else toast.error(res.error);
    });
  const remove = (id: number) =>
    start(async () => {
      if (!confirm("Delete this teaser?")) return;
      const res = await deleteTeaser(id);
      if (res.ok) { toast.success("Deleted"); router.refresh(); } else toast.error(res.error);
    });
  const toggle = (t: Teaser) =>
    start(async () => {
      const res = await toggleTeaser(t.id, !t.active);
      if (res.ok) router.refresh(); else toast.error(res.error);
    });
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setEditing((e) => ({ ...e, imageUrl: url }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {initial.length === 0 && <p className="text-sm text-muted-foreground">No teasers yet.</p>}
        {initial.map((t) => (
          <div key={t.id} className="flex items-center gap-4 rounded-xl border border-border p-3">
            {t.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cldUrl(t.imageUrl, IMG_W.thumb)} alt="" className="h-14 w-12 shrink-0 rounded object-cover ring-1 ring-border" />
            ) : (
              <div className="grid h-14 w-12 shrink-0 place-items-center rounded bg-muted text-[9px] text-muted-foreground">No image</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{t.label || "(untitled)"}</p>
              <p className="truncate text-xs text-muted-foreground">{t.subtext}</p>
            </div>
            {/* The only live control. The edit form used to carry a second one
                that saved on a different action, so the two could disagree:
                switch the row live, then save the form with its box unticked,
                and it went straight back to hidden. */}
            <button
              onClick={() => toggle(t)}
              disabled={pending}
              title={t.active ? "Showing on the shop grid. Click to hide." : "Hidden from the shop. Click to show."}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs ${
                t.active ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
              }`}
            >
              {t.active ? "On the shop" : "Hidden"}
            </button>
            <button onClick={() => setEditing(t)} className="shrink-0 text-sm text-muted-foreground hover:text-foreground">Edit</button>
            <button onClick={() => remove(t.id)} className="shrink-0 text-sm text-muted-foreground hover:text-destructive">Delete</button>
          </div>
        ))}
      </div>

      {editing ? (
        <div className="space-y-4 rounded-xl border border-border p-5">
          <p className="text-xs font-medium uppercase tracking-wide">{editing.id ? "Edit teaser" : "New teaser"}</p>
          <div className="flex flex-wrap items-center gap-3">
            {editing.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cldUrl(editing.imageUrl, IMG_W.thumb)} alt="" className="h-20 w-16 rounded object-cover ring-1 ring-border" />
            ) : (
              <div className="grid h-20 w-16 place-items-center rounded bg-muted text-[9px] text-muted-foreground">No image</div>
            )}
            <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm hover:border-primary">
              {uploading ? "Uploading…" : editing.imageUrl ? "Replace" : "Upload image"}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            </label>
            {editing.imageUrl && <button onClick={() => setEditing((e) => ({ ...e, imageUrl: "" }))} className="text-sm text-muted-foreground hover:text-foreground">Remove</button>}
          </div>
          <UploadHint spec="product" />

          {/* A teaser is a card on a public grid, and there was no way to see
              it as one without switching it live. */}
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-44 overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative aspect-[4/5] bg-muted">
                {editing.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cldUrl(editing.imageUrl, IMG_W.preview)} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute left-2.5 top-2.5 rounded-full bg-background/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.07em]">
                  Coming soon
                </span>
              </div>
              <div className="p-3">
                <p className="truncate text-sm">{editing.label || "Untitled"}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{editing.subtext || "\u00A0"}</p>
              </div>
            </div>
            <p className="max-w-xs text-[11px] leading-relaxed text-muted-foreground">
              How this card will look on the Shop grid.
            </p>
          </div>
          <input className={inputCls} placeholder="Label — e.g. Pattern in development" value={editing.label ?? ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
          <input className={inputCls} placeholder="Subtext — e.g. Arriving in a future drop" value={editing.subtext ?? ""} onChange={(e) => setEditing({ ...editing, subtext: e.target.value })} />
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              Order on the grid
              <input
                type="number"
                className={`${inputCls} w-20`}
                value={editing.sortOrder ?? 0}
                onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) || 0 })}
              />
            </label>
            {editing.id ? (
              <span className="text-xs text-muted-foreground">
                {editing.active ? "Showing on the shop grid." : "Hidden from the shop."} Use the button on its row to
                change that.
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                New teasers start hidden. Show it from its row once you are happy with it.
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={pending} className="rounded-full bg-primary px-5 py-2 text-sm text-white disabled:opacity-50">{pending ? "Saving…" : "Save"}</button>
            <button onClick={() => setEditing(null)} className="rounded-full border border-border px-5 py-2 text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing({ ...blank })} className="rounded-full border border-border px-5 py-2 text-sm hover:border-primary">+ Add teaser</button>
      )}
    </div>
  );
}
