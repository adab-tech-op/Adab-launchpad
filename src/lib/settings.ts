// Client-safe settings types + defaults (no server-only imports) so both the
// studio editor and the rendered banner can share them.

export type BannerSettings = {
  enabled: boolean;
  text: string;
  bgColor: string; // hex, e.g. #ede6d8
  textColor: string; // hex, e.g. #1c1c1c
};

/** Matches the previous hardcoded strip (paper bg, ink text) so nothing changes
 *  visually until an admin edits it. */
export const BANNER_DEFAULT: BannerSettings = {
  enabled: true,
  text: "Founding Drop — this price will not repeat.",
  bgColor: "#ede6d8",
  textColor: "#1c1c1c",
};

// ---- Size Guide (Fit & Sizing popup) --------------------------------------
// One row per size; `values` line up with `columns` by index. Title, columns,
// and every value are admin-editable — nothing about the shape is fixed copy.

export type SizeGuideRow = { size: string; values: string[] };

export type SizeGuideSettings = {
  title: string;
  note: string; // small line under the title, e.g. units/measuring basis
  columns: string[];
  rows: SizeGuideRow[];
  footer: string; // closing guidance line
};

/** Matches the previous hardcoded size-guide modal (US inches) so nothing
 *  changes visually until an admin edits it. */
export const SIZE_GUIDE_DEFAULT: SizeGuideSettings = {
  title: "Size Guide",
  note: "Measurements in inches (US). Garment flat.",
  columns: ["Chest", "Length", "Sleeve", "Shoulder"],
  rows: [
    { size: "S", values: ["40", "30", "24", "17"] },
    { size: "M", values: ["42", "31", "24.5", "18"] },
    { size: "L", values: ["44", "32", "25", "19"] },
    { size: "XL", values: ["46", "32.5", "25.5", "19.5"] },
    { size: "XXL", values: ["48", "33", "26", "20"] },
  ],
  footer: "Adab pieces are cut with a considered, relaxed fit. Choose your usual size, or size up for extra room.",
};

// ---- Product Handover Guide (Delivery & Returns popup) --------------------

export type HandoverGuideSettings = {
  title: string;
  body: string;
};

/** Matches the previous hardcoded delivery/returns copy so nothing changes
 *  visually until an admin edits it. A product's own deliveryNote (set in the
 *  product form) still overrides this, same as before. */
export const HANDOVER_GUIDE_DEFAULT: HandoverGuideSettings = {
  title: "Product Handover Guide",
  body: "Dispatched from Dhaka within 48 hours of drop fulfilment. 7-day returns on unworn pieces with tags.",
};
