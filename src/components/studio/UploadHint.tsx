import { IMAGE_SPECS, type ImageSpecKey } from "@/lib/hero";

/**
 * Small guidance line for an image upload control: recommended dimensions,
 * aspect ratio, and file weight, plus a context note. Use next to every
 * uploader so admins always know the target size.
 */
export function UploadHint({ spec, className = "" }: { spec: ImageSpecKey; className?: string }) {
  const s = IMAGE_SPECS[spec];
  return (
    <p className={`text-[11px] leading-relaxed text-muted-foreground ${className}`}>
      <span className="font-medium text-foreground/80">{s.dims}</span> · {s.ratio} · {s.weight}
      <br />
      {s.note}
    </p>
  );
}
