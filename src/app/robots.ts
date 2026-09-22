import type { MetadataRoute } from "next";
import { getIsolationMode } from "@/lib/settings-server";

export const revalidate = 60;

/**
 * While isolation mode is on, ask every crawler to stay out entirely. When it
 * is switched off the previous rules return, so launching does not require
 * remembering to edit this.
 *
 * robots.txt is only a polite request — the enforcement is the
 * `X-Robots-Tag: noindex` header set in middleware and the gate itself, which
 * means a crawler that ignores this file still gets a sign-in page rather than
 * content.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const isolated = await getIsolationMode();

  if (isolated) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://www.adab.world/sitemap.xml",
  };
}
