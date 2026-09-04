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
