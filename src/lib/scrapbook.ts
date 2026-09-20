// Client-safe scrapbook image shape (studio editor imports this).
export type ScrapbookKind = "photo" | "object";
export type ScrapbookSpan = "normal" | "tall" | "wide";

export type ScrapbookImage = {
  id: number;
  image_url: string;
  caption: string;
  caption_bn: string;
  place: string;
  taken_on: string; // free text — a scrapbook's dates are approximate
  credit: string; // "Rafi" / "@handle" — attribution, no social chrome
  kind: ScrapbookKind; // 'object' renders on paper stock with a slight tilt
  span: ScrapbookSpan; // breaks the uniform tile rhythm
  group_label: string; // "Drop 01" — chronology
  sort_order: number;
};

export const SCRAPBOOK_KINDS: { value: ScrapbookKind; label: string; hint: string }[] = [
  { value: "photo", label: "Photograph", hint: "Full-bleed image tile." },
  { value: "object", label: "Object / scan", hint: "Swatch, thread card, note, tag — sits on paper, slightly tilted." },
];

export const SCRAPBOOK_SPANS: { value: ScrapbookSpan; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "tall", label: "Tall" },
  { value: "wide", label: "Wide" },
];

/** Stable per-item tilt for 'object' tiles. Deterministic from the id so the
 *  page doesn't reshuffle on every render (and matches server and client). */
export function objectTilt(id: number): number {
  const steps = [-1.6, 1.1, -0.8, 1.7, -1.2, 0.9];
  return steps[id % steps.length];
}

/** The provenance line under a tile: "Islampur Road, Dhaka · March 2026". */
export function provenanceOf(img: ScrapbookImage): string {
  return [img.place, img.taken_on].filter(Boolean).join(" · ");
}
