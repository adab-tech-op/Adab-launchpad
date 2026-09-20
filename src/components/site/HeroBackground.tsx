import type { CSSProperties } from "react";
import { CENTER_FOCAL, type FocalPoint, type HeroImages } from "@/lib/hero";
import { lqipUrl } from "@/lib/lqip";

function layer(url: string, f: FocalPoint): CSSProperties {
  const style: CSSProperties = {
    backgroundImage: `url("${url}")`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: `${f.x}% ${f.y}%`,
  };
  if (f.zoom && f.zoom !== 1) {
    style.transform = `scale(${f.zoom})`;
    style.transformOrigin = `${f.x}% ${f.y}%`;
  }
  return style;
}

/**
 * Fills its (positioned, overflow-hidden) parent with the hero image, picking
 * the right source per breakpoint:
 *   phone  (< 768px)   → images.phone,  else desktop framed by focalPhone
 *   tablet (768–1023)  → images.tablet, else desktop framed by focalTablet
 *   desktop (≥ 1024)   → images.desktop, centred
 * Renders nothing when there's no desktop image (caller can show a solid block).
 */
export function HeroBackground({
  images,
  label,
  className = "",
}: {
  images: HeroImages;
  label?: string;
  className?: string;
}) {
  if (!images?.desktop) return null;

  const phoneStyle = images.phone
    ? layer(images.phone, CENTER_FOCAL)
    : layer(images.desktop, images.focalPhone ?? CENTER_FOCAL);
  const tabletStyle = images.tablet
    ? layer(images.tablet, CENTER_FOCAL)
    : layer(images.desktop, images.focalTablet ?? CENTER_FOCAL);
  const desktopStyle = layer(images.desktop, CENTER_FOCAL);

  // The hero is the largest image on the site and the first thing a visitor
  // waits on. A tiny pre-blurred copy underneath means the fold shows the
  // photograph's colour and shape immediately, resolving into focus, instead
  // of a flat block. Sits behind all three breakpoint layers, so whichever one
  // paints simply covers it.
  const placeholder = lqipUrl(images.desktop);

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {placeholder && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${placeholder}")` }}
        />
      )}
      <div className="absolute inset-0 md:hidden" style={phoneStyle} />
      <div className="absolute inset-0 hidden md:block lg:hidden" style={tabletStyle} />
      <div className="absolute inset-0 hidden lg:block" style={desktopStyle} />
    </div>
  );
}
