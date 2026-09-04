"use client";

import { useState, type MouseEvent } from "react";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { UploadHint } from "@/components/studio/UploadHint";
import { CENTER_FOCAL, type FocalPoint, type HeroImages, type ImageSpecKey } from "@/lib/hero";

type Slot = "desktop" | "tablet" | "phone";

export function HeroImagesEditor({
  value,
  onChange,
}: {
  value: HeroImages;
  onChange: (v: HeroImages) => void;
}) {
  const [uploading, setUploading] = useState<Slot | null>(null);
  const set = (patch: Partial<HeroImages>) => onChange({ ...value, ...patch });

  const upload = async (slot: Slot, file: File) => {
    setUploading(slot);
    try {
      const url = await uploadToCloudinary(file);
      set({ [slot]: url } as Partial<HeroImages>);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-5">
      <ImageSlot
        label="Desktop image"
        specKey="heroDesktop"
        url={value.desktop}
        uploading={uploading === "desktop"}
        onUpload={(f) => upload("desktop", f)}
        onRemove={() => set({ desktop: "" })}
      />

      <ImageSlot
        label="Tablet image"
        optional
        specKey="heroTablet"
        url={value.tablet}
        uploading={uploading === "tablet"}
        onUpload={(f) => upload("tablet", f)}
        onRemove={() => set({ tablet: "" })}
      />
      {!value.tablet && value.desktop && (
        <FocalControl
          device="tablet"
          image={value.desktop}
          focal={value.focalTablet ?? CENTER_FOCAL}
          aspect={4 / 3}
          width={150}
          onChange={(focalTablet) => set({ focalTablet })}
        />
      )}

      <ImageSlot
        label="Phone image"
        optional
        specKey="heroPhone"
        url={value.phone}
        uploading={uploading === "phone"}
        onUpload={(f) => upload("phone", f)}
        onRemove={() => set({ phone: "" })}
      />
      {!value.phone && value.desktop && (
        <FocalControl
          device="phone"
          image={value.desktop}
          focal={value.focalPhone ?? CENTER_FOCAL}
          aspect={3 / 4}
          width={96}
          onChange={(focalPhone) => set({ focalPhone })}
        />
      )}
    </div>
  );
}

function ImageSlot({
  label,
  optional,
  specKey,
  url,
  uploading,
  onUpload,
  onRemove,
}: {
  label: string;
  optional?: boolean;
  specKey: ImageSpecKey;
  url: string;
  uploading: boolean;
  onUpload: (f: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.14em]">
          {label}
          {optional && <span className="ml-1.5 normal-case tracking-normal text-muted-foreground">(optional)</span>}
        </span>
      </div>
      <UploadHint spec={specKey} className="mt-1.5" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-16 w-28 shrink-0 rounded object-cover ring-1 ring-border" />
        ) : (
          <div className="grid h-16 w-28 shrink-0 place-items-center rounded bg-muted text-[9px] uppercase tracking-wide text-muted-foreground">
            No image
          </div>
        )}
        <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm hover:border-primary">
          {uploading ? "Uploading…" : url ? "Replace" : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
        </label>
        {url && (
          <button type="button" onClick={onRemove} className="text-sm text-muted-foreground hover:text-foreground">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function FocalControl({
  device,
  image,
  focal,
  aspect,
  width,
  onChange,
}: {
  device: "tablet" | "phone";
  image: string;
  focal: FocalPoint;
  aspect: number;
  width: number;
  onChange: (f: FocalPoint) => void;
}) {
  const f = focal ?? CENTER_FOCAL;

  const pickFocus = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp(Math.round(((e.clientX - rect.left) / rect.width) * 100), 0, 100);
    const y = clamp(Math.round(((e.clientY - rect.top) / rect.height) * 100), 0, 100);
    onChange({ ...f, x, y });
  };

  return (
    <div className="rounded-lg border border-dashed border-border p-3">
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        No {device} image, so the desktop one is used here. Click the preview or drag the sliders to choose which part shows on {device}.
      </p>
      <div className="mt-2 flex items-start gap-4">
        <div
          className="relative shrink-0 cursor-crosshair overflow-hidden rounded-md ring-1 ring-border"
          style={{ width, aspectRatio: String(aspect) }}
          onClick={pickFocus}
          title="Click to set the focus point"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("${image}")`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: `${f.x}% ${f.y}%`,
              transform: f.zoom !== 1 ? `scale(${f.zoom})` : undefined,
              transformOrigin: `${f.x}% ${f.y}%`,
            }}
          />
          <span
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/30"
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Slider label="Horizontal" value={f.x} min={0} max={100} onChange={(x) => onChange({ ...f, x })} suffix="%" />
          <Slider label="Vertical" value={f.y} min={0} max={100} onChange={(y) => onChange({ ...f, y })} suffix="%" />
          <Slider label="Zoom" value={Math.round(f.zoom * 100)} min={100} max={300} onChange={(z) => onChange({ ...f, zoom: z / 100 })} suffix="%" />
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
        <span className="tabular-nums">{value}{suffix}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-foreground"
      />
    </label>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
