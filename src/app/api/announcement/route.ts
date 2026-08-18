export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAnnouncementSettings } from "@/lib/announcement-server";

// Read-only public settings for the landing popup. Cached via the "announcement"
// tag (see getAnnouncementSettings); admin saves revalidate it. Keeps site pages
// static — only this tiny endpoint is hit by the modal on mount.
export async function GET() {
  const settings = await getAnnouncementSettings();
  return NextResponse.json(settings);
}
