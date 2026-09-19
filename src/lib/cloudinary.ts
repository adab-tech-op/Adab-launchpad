// Client-side unsigned upload to Cloudinary. Cloud name + preset are public
// identifiers (safe in client code); overridable via env.
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "oma9klak";
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "Adab Launchpad";

export async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}). ${detail}`);
  }
  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("Upload succeeded but no URL returned.");
  return data.secure_url;
}

/** Same unsigned preset, video endpoint. Returns the secure URL. Videos are
 *  much larger than images, so callers should show progress/disable while it
 *  runs — Cloudinary's unsigned uploads cap at 100 MB. */
export async function uploadVideoToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/video/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Video upload failed (${res.status}). ${detail}`);
  }
  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("Upload succeeded but no URL returned.");
  return data.secure_url;
}
