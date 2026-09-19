// Client-safe fabric-type shape (no server-only imports) so the studio editor
// and product form can share it. DB reads live in ./fabrics-server.

export type FabricType = {
  id: number;
  slug: string;
  name: string;
  care_detail: string;
  thumbnail_url: string;
  details: string; // "Little details" card blurb
  washing: string;
  drying: string;
  ironing: string;
  storage: string;
  at_a_glance: string; // one short line, e.g. "Hand wash cold · Shade dry · Medium iron"
  // The card's photo runs full-bleed down one side, so each fabric tints its
  // own image the way a hero overlay does.
  overlay_enabled: boolean;
  overlay_color: string;
  overlay_opacity: number; // 0-100
  overlay_from: string; // solid | bottom | top | left | right | corners
  sort_order: number;
};

/** The 4 structured care sections, in display order — shared by the Care
 *  Guide card grid, the fabric popup, and the studio editor. */
export const CARE_SECTIONS = [
  { key: "washing", label: "Washing" },
  { key: "drying", label: "Drying" },
  { key: "ironing", label: "Ironing" },
  { key: "storage", label: "Storage" },
] as const;
