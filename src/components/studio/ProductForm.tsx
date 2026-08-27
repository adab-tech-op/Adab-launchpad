"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createProduct, updateProduct, type EditableProduct } from "@/lib/actions/products-admin";
import type { FabricType } from "@/lib/fabrics";

const inputCls =
  "w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";
const labelCls = "font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground";
const STATUSES = ["Preview", "Available", "Coming Soon"] as const;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const empty: EditableProduct = {
  slug: "",
  name: "",
  status: "Preview",
  price_bdt: 0,
  founding_note: "Founding price — final price to follow",
  color: "",
  swatches: [{ name: "", hex: "#003153" }],
  short: "",
  images: [],
  details: [],
  model_note: "",
  fabric_note: "",
  story: "",
  fit_note: "",
  care_note: "",
  delivery_note: "",
  fabric_type_id: null,
  sort_order: 0,
};

export function ProductForm({ initial, mode, fabricTypes }: { initial?: EditableProduct; mode: "create" | "edit"; fabricTypes: FabricType[] }) {
  const router = useRouter();
  const [p, setP] = useState<EditableProduct>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const set = <K extends keyof EditableProduct>(k: K, v: EditableProduct[K]) => setP((s) => ({ ...s, [k]: v }));

  const onNameChange = (name: string) => {
    setP((s) => ({ ...s, name, slug: mode === "create" && (!s.slug || s.slug === slugify(s.name)) ? slugify(name) : s.slug }));
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadToCloudinary(file));
      }
      setP((s) => ({ ...s, images: [...s.images, ...urls] }));
      toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (i: number, dir: -1 | 1) => {
    setP((s) => {
      const imgs = [...s.images];
      const j = i + dir;
      if (j < 0 || j >= imgs.length) return s;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      return { ...s, images: imgs };
    });
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      ...p,
      founding_note: p.founding_note || "",
      swatches: p.swatches.filter((sw) => sw.name.trim() !== ""),
      details: p.details.filter((d) => d.trim() !== ""),
    };
    const res = mode === "create" ? await createProduct(payload) : await updateProduct(payload);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(mode === "create" ? "Product created" : "Changes saved");
    router.push("/studio/products");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className={labelCls}>Name</span>
          <input value={p.name} onChange={(e) => onNameChange(e.target.value)} className={inputCls + " mt-2"} />
        </label>
        <label className="block">
          <span className={labelCls}>Slug (URL)</span>
          <input
            value={p.slug}
            onChange={(e) => set("slug", slugify(e.target.value))}
            disabled={mode === "edit"}
            className={inputCls + " mt-2 disabled:opacity-60"}
          />
          {mode === "edit" && <span className="mt-1 block text-[11px] text-muted-foreground">Slug can't change after creation.</span>}
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <label className="block">
          <span className={labelCls}>Status</span>
          <select value={p.status} onChange={(e) => set("status", e.target.value as EditableProduct["status"])} className={inputCls + " mt-2"}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Price (৳)</span>
          <input type="number" min={0} placeholder="4500" value={p.price_bdt || ""} onChange={(e) => set("price_bdt", Number(e.target.value) || 0)} className={inputCls + " mt-2"} />
        </label>
        <label className="block">
          <span className={labelCls}>Main color</span>
          <input value={p.color} onChange={(e) => set("color", e.target.value)} placeholder="e.g. Steel Blue" className={inputCls + " mt-2"} />
          <span className="mt-1 block text-[10px] text-muted-foreground">Color name shown on the product page.</span>
        </label>
        <label className="block">
          <span className={labelCls}>Sort order</span>
          <input type="number" min={0} placeholder="0" value={p.sort_order || ""} onChange={(e) => set("sort_order", Number(e.target.value) || 0)} className={inputCls + " mt-2"} />
          <span className="mt-1 block text-[10px] text-muted-foreground">Lower shows first on shop.</span>
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>Additional product note (optional)</span>
        <input value={p.founding_note} onChange={(e) => set("founding_note", e.target.value)} className={inputCls + " mt-2"} />
      </label>

      <label className="block">
        <span className={labelCls}>Description</span>
        <textarea value={p.short} onChange={(e) => set("short", e.target.value)} rows={3} className={inputCls + " mt-2 resize-y"} />
      </label>

      <label className="block">
        <span className={labelCls}>Product story (optional) <span className="normal-case tracking-normal">(the lead accordion on the product page — hidden if left empty)</span></span>
        <textarea value={p.story} onChange={(e) => set("story", e.target.value)} rows={4} placeholder="The narrative behind the piece — heritage, references, the idea. Bengali and English can mix on the same line." className={inputCls + " mt-2 resize-y"} />
      </label>

      {/* Details / feature bullets */}
      <div>
        <span className={labelCls}>Details / features <span className="normal-case tracking-normal">(bullet list on the product page)</span></span>
        <div className="mt-2 space-y-2">
          {p.details.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-muted-foreground">·</span>
              <input
                value={d}
                onChange={(e) => setP((s) => ({ ...s, details: s.details.map((x, j) => (j === i ? e.target.value : x)) }))}
                placeholder="e.g. Bamboo-cotton fleece blend"
                className={inputCls}
              />
              <button type="button" onClick={() => setP((s) => ({ ...s, details: s.details.filter((_, j) => j !== i) }))} className="shrink-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setP((s) => ({ ...s, details: [...s.details, ""] }))} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" /> Add detail
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <label className="block">
          <span className={labelCls}>Model note (optional)</span>
          <input value={p.model_note} onChange={(e) => set("model_note", e.target.value)} placeholder={`Model is 5'9", athletic build, wearing size L.`} className={inputCls + " mt-2"} />
        </label>
        <label className="block">
          <span className={labelCls}>Fabric &amp; craft note (optional) <span className="normal-case tracking-normal">(shown in the accordion)</span></span>
          <textarea value={p.fabric_note} onChange={(e) => set("fabric_note", e.target.value)} rows={2} className={inputCls + " mt-2 resize-y"} />
        </label>
      </div>

      {/* PDP accordions — each overrides the standard copy; blank falls back to the default shown on every product */}
      <div className="grid grid-cols-1 gap-4">
        <label className="block">
          <span className={labelCls}>Fit &amp; sizing (optional) <span className="normal-case tracking-normal">(accordion — blank shows the standard fit copy)</span></span>
          <textarea value={p.fit_note} onChange={(e) => set("fit_note", e.target.value)} rows={2} placeholder="Adab pieces are cut with a considered, relaxed fit. Choose your usual size, or size up for extra room." className={inputCls + " mt-2 resize-y"} />
        </label>
        <label className="block">
          <span className={labelCls}>Fabric type <span className="normal-case tracking-normal">(sets the Care Guide shown on the product; manage the list in Studio → Fabrics)</span></span>
          <select
            value={p.fabric_type_id ?? ""}
            onChange={(e) => set("fabric_type_id", e.target.value ? Number(e.target.value) : null)}
            className={inputCls + " mt-2"}
          >
            <option value="">— None —</option>
            {fabricTypes.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelCls}>Care guide override (optional) <span className="normal-case tracking-normal">(leave blank to use the fabric type&rsquo;s care guide above; falls back to the standard copy if no type is set)</span></span>
          <textarea value={p.care_note} onChange={(e) => set("care_note", e.target.value)} rows={2} placeholder="Only fill this to override the fabric type's care for this one product." className={inputCls + " mt-2 resize-y"} />
        </label>
        <label className="block">
          <span className={labelCls}>Delivery &amp; returns (optional) <span className="normal-case tracking-normal">(accordion — blank shows the standard policy; usually leave blank)</span></span>
          <textarea value={p.delivery_note} onChange={(e) => set("delivery_note", e.target.value)} rows={2} placeholder="Dispatched from Dhaka within 48 hours of drop fulfilment. 7-day returns on unworn pieces with tags." className={inputCls + " mt-2 resize-y"} />
        </label>
      </div>

      {/* Swatches */}
      <div>
        <span className={labelCls}>Colour swatches</span>
        <div className="mt-2 space-y-2">
          {p.swatches.map((sw, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(sw.hex) ? sw.hex : "#003153"}
                onChange={(e) => setP((s) => ({ ...s, swatches: s.swatches.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) }))}
                className="h-9 w-10 shrink-0 rounded border border-border bg-transparent"
              />
              <input
                placeholder="Name (e.g. Steel Blue)"
                value={sw.name}
                onChange={(e) => setP((s) => ({ ...s, swatches: s.swatches.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) }))}
                className={inputCls}
              />
              <input
                placeholder="#003153"
                value={sw.hex}
                onChange={(e) => setP((s) => ({ ...s, swatches: s.swatches.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) }))}
                className={inputCls + " w-32 shrink-0 tabular-nums"}
              />
              <button type="button" onClick={() => setP((s) => ({ ...s, swatches: s.swatches.filter((_, j) => j !== i) }))} className="shrink-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setP((s) => ({ ...s, swatches: [...s.swatches, { name: "", hex: "#003153" }] }))} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" /> Add swatch
          </button>
        </div>
      </div>

      {/* Images */}
      <div>
        <span className={labelCls}>Images <span className="normal-case tracking-normal">(first is the cover)</span></span>
        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-3">
          {p.images.map((url, i) => (
            <div key={url + i} className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-[color:var(--paper)]">
              <img src={url} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-foreground/80 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-background">Cover</span>}
              <button
                type="button"
                onClick={() => setP((s) => ({ ...s, images: s.images.filter((_, j) => j !== i) }))}
                aria-label="Remove image"
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive shadow-sm hover:bg-background"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-background/85 py-1">
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Move earlier" className="disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => moveImage(i, 1)} disabled={i === p.images.length - 1} aria-label="Move later" className="disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" strokeWidth={1.5} />}
            <span className="text-[10px] uppercase tracking-[0.14em]">{uploading ? "Uploading" : p.images.length ? "Add / replace" : "Upload"}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} disabled={uploading} />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            placeholder="…or paste an image URL and press Add"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (document.getElementById("add-img-url") as HTMLButtonElement)?.click();
              }
            }}
            className={inputCls}
          />
          <button
            id="add-img-url"
            type="button"
            onClick={() => {
              const url = urlInput.trim();
              try {
                new URL(url);
              } catch {
                toast.error("Enter a valid image URL (https://…)");
                return;
              }
              setP((s) => ({ ...s, images: [...s.images, url] }));
              setUrlInput("");
            }}
            className="shrink-0 rounded-md border border-border px-4 text-xs uppercase tracking-[0.14em] hover:border-foreground transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || uploading}
          className="rounded-full bg-foreground px-8 py-3.5 text-xs uppercase tracking-[0.2em] text-background hover:bg-foreground/85 transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        <button type="button" onClick={() => router.push("/studio/products")} className="text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </div>
    </div>
  );
}
