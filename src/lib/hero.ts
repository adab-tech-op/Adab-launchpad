// Shared hero-image model + the upload guidance shown across the studio.
// Client-safe (no server-only imports) so both editors and pages can use it.

/** Focal point (percent) + zoom applied to the DESKTOP image when it stands in
 *  for a tablet/phone screen that has no dedicated upload. x/y 0–100, zoom ≥ 1. */
export type FocalPoint = { x: number; y: number; zoom: number };

export type HeroImages = {
  desktop: string; // Cloudinary URL; "" = no image (page shows a solid block)
  tablet: string; // optional; "" = fall back to desktop (with focalTablet)
  phone: string; // optional; "" = fall back to desktop (with focalPhone)
  focalTablet: FocalPoint; // how the desktop image is framed on tablets
  focalPhone: FocalPoint; // how the desktop image is framed on phones
};

export const CENTER_FOCAL: FocalPoint = { x: 50, y: 50, zoom: 1 };

export function emptyHeroImages(): HeroImages {
  return {
    desktop: "",
    tablet: "",
    phone: "",
    focalTablet: { ...CENTER_FOCAL },
    focalPhone: { ...CENTER_FOCAL },
  };
}

/** Accept partial / legacy shapes (older rows stored a single `image` string)
 *  and always return a complete HeroImages. */
export function normalizeHeroImages(raw: unknown, legacyImage?: string): HeroImages {
  const base = emptyHeroImages();
  if (typeof raw === "object" && raw !== null) {
    const r = raw as Partial<HeroImages> & { image?: string };
    base.desktop = typeof r.desktop === "string" ? r.desktop : r.image || "";
    base.tablet = typeof r.tablet === "string" ? r.tablet : "";
    base.phone = typeof r.phone === "string" ? r.phone : "";
    base.focalTablet = normalizeFocal(r.focalTablet);
    base.focalPhone = normalizeFocal(r.focalPhone);
  }
  if (!base.desktop && legacyImage) base.desktop = legacyImage;
  return base;
}

function normalizeFocal(f: unknown): FocalPoint {
  if (typeof f !== "object" || f === null) return { ...CENTER_FOCAL };
  const p = f as Partial<FocalPoint>;
  return {
    x: clamp(typeof p.x === "number" ? p.x : 50, 0, 100),
    y: clamp(typeof p.y === "number" ? p.y : 50, 0, 100),
    zoom: clamp(typeof p.zoom === "number" ? p.zoom : 1, 1, 3),
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/** Every non-empty image URL in a hero (for cleanup diffing). */
export function heroImageUrls(h: HeroImages | null | undefined): string[] {
  if (!h) return [];
  return [h.desktop, h.tablet, h.phone].filter((u): u is string => !!u);
}

// ---- Overlay -----------------------------------------------------------------
// A colour wash over the hero image for legibility / mood. Either solid or a
// linear gradient that fades in from one edge/corner ("appears from").

export type OverlayFrom =
  | "solid"
  | "bottom"
  | "top"
  | "left"
  | "right"
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right";

export type HeroOverlay = {
  enabled: boolean;
  color: string; // hex, e.g. "#000000"
  opacity: number; // 0–100 (the strong end)
  from: OverlayFrom; // which edge/corner the colour appears from
};

export function defaultOverlay(): HeroOverlay {
  return { enabled: false, color: "#000000", opacity: 40, from: "bottom" };
}

export const OVERLAY_FROM_OPTIONS: { value: OverlayFrom; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "bottom", label: "Bottom" },
  { value: "top", label: "Top" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "bottom-left", label: "Bottom-left" },
  { value: "bottom-right", label: "Bottom-right" },
  { value: "top-left", label: "Top-left" },
  { value: "top-right", label: "Top-right" },
];

// "appears from X" → gradient travels toward the opposite side.
const GRADIENT_DIR: Record<Exclude<OverlayFrom, "solid">, string> = {
  bottom: "to top",
  top: "to bottom",
  left: "to right",
  right: "to left",
  "bottom-left": "to top right",
  "bottom-right": "to top left",
  "top-left": "to bottom right",
  "top-right": "to bottom left",
};

export function hexToRgba(hex: string, alpha: number): string {
  let h = (hex || "").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** CSS for the overlay layer, or null when it shouldn't render. */
export function overlayStyle(o: HeroOverlay | null | undefined): import("react").CSSProperties | null {
  if (!o || !o.enabled) return null;
  const rgba = hexToRgba(o.color, Math.min(100, Math.max(0, o.opacity)) / 100);
  if (o.from === "solid") return { backgroundColor: rgba };
  return { backgroundImage: `linear-gradient(${GRADIENT_DIR[o.from]}, ${rgba}, transparent)` };
}

export function normalizeOverlay(raw: unknown, legacyScrim?: number): HeroOverlay {
  const base = defaultOverlay();
  if (typeof raw === "object" && raw !== null) {
    const r = raw as Partial<HeroOverlay>;
    return {
      enabled: typeof r.enabled === "boolean" ? r.enabled : base.enabled,
      color: typeof r.color === "string" ? r.color : base.color,
      opacity: clamp(typeof r.opacity === "number" ? r.opacity : base.opacity, 0, 100),
      from: (OVERLAY_FROM_OPTIONS.some((o) => o.value === r.from) ? r.from : base.from) as OverlayFrom,
    };
  }
  // Legacy: a plain scrim number (0–80) was a solid black wash.
  if (typeof legacyScrim === "number") {
    return { enabled: legacyScrim > 0, color: "#000000", opacity: legacyScrim || 40, from: "solid" };
  }
  return base;
}

// ---- Upload guidance ---------------------------------------------------------
// One place to describe the recommended file for each upload slot. Rendered by
// <UploadHint> next to the control so admins always know the target size.

export type ImageSpec = { dims: string; ratio: string; weight: string; note: string };

export const IMAGE_SPECS = {
  heroDesktop: {
    dims: "2560 × 1440 px",
    ratio: "16:9 landscape",
    weight: "JPG/WebP, ≤ 600 KB",
    note: "Shown on screens ≥ 1024px. Keep the subject off the far edges.",
  },
  heroTablet: {
    dims: "1600 × 1200 px",
    ratio: "4:3",
    weight: "≤ 400 KB",
    note: "Shown 768–1023px. Optional — if empty, the desktop image is used with the focus set below.",
  },
  heroPhone: {
    dims: "1080 × 1440 px",
    ratio: "3:4 portrait",
    weight: "≤ 300 KB",
    note: "Shown < 768px. Optional — if empty, the desktop image is used with the focus set below.",
  },
  product: {
    dims: "1024 × 1280 px",
    ratio: "4:5 portrait",
    weight: "JPG/WebP, ≤ 500 KB",
    note: "The first image is the cover (the card thumbnail). Shoot on a consistent background.",
  },
  scrapbook: {
    dims: "long edge ≥ 1200 px",
    ratio: "any orientation",
    weight: "≤ 500 KB",
    note: "Masonry keeps each image's proportions.",
  },
  manifestoStory: {
    dims: "1200 × 1500 px",
    ratio: "4:5 portrait",
    weight: "≤ 500 KB",
    note: "Portrait sits best in the sticky panel beside the text.",
  },
} satisfies Record<string, ImageSpec>;

export type ImageSpecKey = keyof typeof IMAGE_SPECS;
