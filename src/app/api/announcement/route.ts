export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAnnouncementSettings } from "@/lib/announcement-server";
import { getIsolationMode } from "@/lib/settings-server";

// Read-only public settings for the landing popup. Cached via the "announcement"
// tag (see getAnnouncementSettings); admin saves revalidate it. Keeps site pages
// static — only this tiny endpoint is hit by the modal on mount.
export async function GET() {
  // Route handlers bypass the root layout, so the isolation gate never sees
  // this one either. Closed while the site is private.
  if (await getIsolationMode()) return new NextResponse(null, { status: 404 });

  const settings = await getAnnouncementSettings();
  return NextResponse.json(settings);
}
