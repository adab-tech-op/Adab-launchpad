"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, UploadCloud } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { addScrapbookImage, updateScrapbookImage, deleteScrapbookImage } from "@/lib/actions/scrapbook";
import type { ScrapbookImage } from "@/lib/scrapbook";
import { UploadHint } from "@/components/studio/UploadHint";

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Tile({ img }: { img: ScrapbookImage }) {
  const router = useRouter();
  const [caption, setCaption] = useState(img.caption);
  const [order, setOrder] = useState(String(img.sort_order));
  const [pending, start] = useTransition();
  const dirty = caption !== img.caption || order !== String(img.sort_order);

  const save = () =>
    start(async () => {
      const res = await updateScrapbookImage(img.id, { caption, sort_order: order });
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
        <input className={inputCls} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" />
        <div className="flex items-center gap-2">
          <input className={`${inputCls} w-20`} type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Sort order" />
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
