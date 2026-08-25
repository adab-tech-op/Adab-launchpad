// Images live in /public/assets and are referenced by URL path.
const piranMain = "/assets/product-piran-main.jpg";
const piranDetail = "/assets/product-piran-detail.jpg";
const hoodieMain = "/assets/product-hoodie-main.jpg";
const hoodieDetail = "/assets/product-hoodie-detail.jpg";

export type Product = {
  slug: string;
  name: string;
  status: "Preview" | "Available" | "Coming Soon";
  price: string;
  foundingNote?: string;
  color: string;
  swatches: { name: string; hex: string }[];
  short: string;
  images: string[];
  details: string[];
  modelNote?: string;
  fabricNote?: string;
  story?: string;
};

export const products: Product[] = [
  {
    slug: "adab-piran-warm-charcoal",
    name: "Adab Piran — Warm Charcoal",
    status: "Preview",
    price: "৳ 4,500",
    foundingNote: "Founding price — final price to follow",
    color: "Warm Charcoal",
    swatches: [
      { name: "Warm Charcoal", hex: "#2b2b2e" },
      { name: "Parchment", hex: "#f5f0e8" },
    ],
    short:
      "A modern piran in matte China Grace woven fabric — band collar, concentric arch tonal embroidery on the placket, hem sitting 1.5–2 inches below the crotch.",
    images: [piranMain, piranDetail, piranMain, piranDetail],
    details: [
      "China Grace matte woven fabric",
      "Band collar with structured placket",
      "Concentric arch tonal embroidery on placket",
      "Hem sits 1.5–2 inches below the crotch point",
      "Relaxed sleeve, considered cuff",
      "Designed and made in Bangladesh",
    ],
    modelNote: "Model is 5'9\", athletic build, wearing size L.",
    fabricNote:
      "Matte China Grace woven fabric with a soft, dry hand. Reinforced placket, tonal concentric arch embroidery, matte hardware, double-stitched hem.",
    story:
      "A modern reinterpretation of the piran — the short-hemmed shirt worn across East Bengal in the 1950s and 60s, referenced by Bengali writer Rajshekhar Basu in 1958. Same DNA, new language.",
  },
  {
    slug: "adab-hoodie-steel-blue",
    name: "Adab Hoodie — Steel Blue",
    status: "Preview",
    price: "৳ 7,000",
    foundingNote: "Founding price — final price to follow",
    color: "Steel Blue",
    swatches: [
      { name: "Steel Blue", hex: "#4682b4" },
      { name: "Prussian", hex: "#003153" },
    ],
    short:
      "Bamboo-cotton fleece hoodie with three gold-toned metal buttons and geometric linear tonal embroidery on the placket.",
    images: [hoodieMain, hoodieDetail, hoodieMain, hoodieDetail],
    details: [
      "Bamboo-cotton fleece blend",
      "Three gold-toned metal buttons",
      "Geometric linear tonal embroidery on placket",
      "Soft-lined hood, relaxed drop shoulder",
      "Kangaroo pocket, ribbed cuff",
      "Designed and made in Bangladesh",
    ],
    modelNote: "Model is 5'9\", athletic build, wearing size L.",
    fabricNote:
      "Bamboo-cotton fleece blend — soft, breathable, temperature-regulating. Three gold-toned metal buttons, geometric linear tonal embroidery, ribbed cuffs and hem.",
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
