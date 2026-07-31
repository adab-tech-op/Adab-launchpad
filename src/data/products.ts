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
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
