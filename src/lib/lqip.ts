/**
 * Low-quality image placeholders for blur-up.
 *
 * The blur is baked into the Cloudinary transform (`e_blur`) rather than
 * applied with a CSS `filter` at runtime. That matters: `filter: blur()`
 * repaints every frame it animates and the cost scales with the blurred area,
 * which is exactly the wrong thing to do on a page rendering a dozen large
 * cards. A 32px-wide pre-blurred image scaled up is free to composite.
 *
 * The placeholder is ~1-2 kB, so it lands almost immediately and the visitor
 * sees the shape and colour of the photo resolving into focus instead of an
 * empty box filling in.
 */

const UPLOAD = "/upload/";

/** True for URLs we can transform. Local /assets/* and any third-party URL
 *  can't be resized on the fly, so they fall back to a plain fade. */
export function isTransformable(url: string | null | undefined): boolean {
  return !!url && url.includes("res.cloudinary.com") && url.includes(UPLOAD);
}

/**
 * Inserts a transform chain immediately after `/upload/`, preserving any
 * version segment and the public id. Returns null when the URL isn't ours.
 */
function withTransform(url: string, transform: string): string | null {
  if (!isTransformable(url)) return null;
  const i = url.indexOf(UPLOAD);
  return `${url.slice(0, i)}${UPLOAD}${transform}/${url.slice(i + UPLOAD.length)}`;
}

/** A tiny, heavily blurred stand-in for the real photograph. */
export function lqipUrl(url: string): string | null {
  return withTransform(url, "w_32,e_blur:1200,q_auto:low,f_auto");
}
