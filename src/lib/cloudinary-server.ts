import "server-only";
import crypto from "crypto";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "oma9klak";
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

/** Extract the Cloudinary public_id from one of our delivery URLs.
 *  Returns null for non-Cloudinary URLs (e.g. local /assets seeds) so those are
 *  left alone. Handles an optional version segment and folders. */
function publicIdFromUrl(url: string): string | null {
  const marker = `res.cloudinary.com/${CLOUD}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const afterCloud = url.slice(i + marker.length); // image/upload/v123/folder/name.jpg
  const up = afterCloud.indexOf("/upload/");
  if (up === -1) return null;
  let rest = afterCloud.slice(up + "/upload/".length); // v123/folder/name.jpg
  rest = rest.replace(/^v\d+\//, ""); // strip version
  rest = rest.replace(/\.[a-zA-Z0-9]+$/, ""); // strip extension
  return rest || null;
}

/** Best-effort delete of a Cloudinary asset by its stored secure_url. No-ops for
 *  non-Cloudinary URLs and when API creds are unset. NEVER throws — image cleanup
 *  is hygiene, it must never break the DB operation it follows. */
export async function deleteFromCloudinary(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const publicId = publicIdFromUrl(url);
  if (!publicId) return;
  if (!API_KEY || !API_SECRET) {
    console.warn(`[cloudinary] API key/secret not set — skipping delete of ${publicId}`);
    return;
  }
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
      .digest("hex");
    const body = new URLSearchParams({ public_id: publicId, api_key: API_KEY, timestamp: String(timestamp), signature });
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`, { method: "POST", body });
    if (!res.ok) {
      console.error(`[cloudinary] destroy failed (${res.status}) for ${publicId}`, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error(`[cloudinary] destroy error for ${publicId}`, err);
  }
}

/** Delete several assets best-effort, in parallel. */
export async function deleteManyFromCloudinary(urls: (string | null | undefined)[]): Promise<void> {
  await Promise.all(urls.map((u) => deleteFromCloudinary(u)));
}
