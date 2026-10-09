/**
 * Cloudinary delivery transforms.
 *
 * Every image on the site is a raw Cloudinary `secure_url` in a plain <img>,
 * so whatever was uploaded is what every visitor downloads: a 4 MB JPEG stays
 * a 4 MB JPEG, at full resolution, scaled down by CSS.
 *
 * Cloudinary can fix that at delivery time without touching a single stored
 * URL. `f_auto` negotiates the format per browser (AVIF to Chrome, WebP to
 * Safari, JPEG to anything old), `q_auto` picks the quality per image, and
 * `c_limit,w_N` caps the pixels we ship to roughly what the layout renders.
 * `c_limit` never upscales and never changes the aspect ratio, so a small
 * source is left alone and nothing gets cropped.
 *
 * Transformations live in the path, right after `/upload/`:
 *   https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto,c_limit,w_800/v123/name.jpg
 */

/** Pixel budgets per surface. Roughly 2x the CSS size for small thumbnails so
 *  they stay sharp on retina, and the authored spec for the large ones. */
export const IMG_W = {
  /** Hero slides. Matches the 2560px authoring spec in IMAGE_SPECS. */
  hero: 2560,
  /** Full-screen zoom overlay on the product page. */
  zoom: 1600,
  /** Product gallery main image and the editorial story portraits. */
  large: 1280,
  /** Scrapbook masonry tiles (~400px columns). */
  tile: 900,
  /** Product cards, wishlist tiles, fabric care cards. */
  card: 800,
  /** Studio list previews and fabric swatches. */
  preview: 400,
  /** Cart, checkout, search and studio row thumbnails (~64-80px). */
  thumb: 160,
  /** Brand value icons and the studio logo preview. */
  icon: 96,
} as const;

export type ImgWidth = (typeof IMG_W)[keyof typeof IMG_W];

/** Cloudinary's transform keys. Only what the delivery URL actually uses, not
 *  the whole vocabulary: enough to recognise a transform segment on sight. */
const TRANSFORM_KEYS = new Set([
  "a", "ac", "ar", "b", "bo", "br", "c", "co", "cs", "d", "dl", "dn", "dpr",
  "du", "e", "eo", "f", "fl", "fn", "g", "h", "if", "ki", "l", "o", "pg", "q",
  "r", "so", "t", "u", "vc", "w", "x", "y", "z",
]);

/** A filename, which is what sits after `/upload/` when there is no transform
 *  and no version. Transform segments never carry a file extension, and that is
 *  the one dependable way to tell `f_auto,q_auto` from `my_photo_2.jpg`. */
const HAS_EXTENSION = /\.[a-z0-9]{2,5}(?:$|[?#])/i;

/** True when the path segment after `/upload/` is an existing transform, so we
 *  leave the URL alone rather than stacking a second transform onto it. */
function isTransformSegment(segment: string): boolean {
  if (!segment || /^v\d+$/.test(segment)) return false;
  if (HAS_EXTENSION.test(segment)) return false;
  const parts = segment.split(",");
  return parts.every((p) => {
    const key = p.slice(0, p.indexOf("_"));
    return p.includes("_") && TRANSFORM_KEYS.has(key);
  });
}

/** True for URLs `f_auto` would damage or has no business touching. */
function skip(url: string): boolean {
  // Local assets, data URIs, static imports resolved to /_next/... paths.
  if (!url.includes("res.cloudinary.com")) return true;
  // f_auto rasterises an SVG, which destroys the logo lockup.
  if (/\.svg(?:$|[?#])/i.test(url)) return true;
  // Video needs its own transform vocabulary; leave it to the player.
  if (url.includes("/video/upload/")) return true;
  return false;
}

/**
 * Add format, quality and a width cap to a Cloudinary image URL.
 *
 * Anything that is not a plain Cloudinary image URL comes back untouched, so
 * this is safe to wrap around a value that might be a local asset, an empty
 * string, or null.
 */
export function cldUrl(url: string | null | undefined, width?: number): string {
  if (!url) return "";
  if (skip(url)) return url;

  const marker = "/image/upload/";
  const at = url.indexOf(marker);
  if (at === -1) return url;

  const head = url.slice(0, at + marker.length);
  const tail = url.slice(at + marker.length);

  // Already carries a transform (hand-pasted URL, or a second pass through
  // this helper). Leave it exactly as it is rather than stacking another.
  if (isTransformSegment(tail.split("/")[0] ?? "")) return url;

  const parts = ["f_auto", "q_auto"];
  if (width) parts.push("c_limit", `w_${width}`);
  return `${head}${parts.join(",")}/${tail}`;
}

/**
 * A `srcset` for one Cloudinary image at several widths, for surfaces whose
 * rendered size varies a lot between phone and desktop. Pair it with a
 * `sizes` attribute or the browser assumes 100vw.
 */
export function cldSrcSet(url: string | null | undefined, widths: number[]): string | undefined {
  if (!url || skip(url)) return undefined;
  return widths.map((w) => `${cldUrl(url, w)} ${w}w`).join(", ");
}
