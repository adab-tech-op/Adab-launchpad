import { requireStudioAccess, atLeast } from "@/lib/roles";
import { redirect } from "next/navigation";
import { getAnnouncementSettings } from "@/lib/announcement-server";
import { AnnouncementEditor } from "./announcement-client";

export const metadata = { title: "Announcement — ADAB Studio" };

export default async function AnnouncementPage() {
  const actor = await requireStudioAccess();
  if (!atLeast(actor.role, "admin")) redirect("/studio"); // moderators can't edit
  const settings = await getAnnouncementSettings();

  return (
    <div>
      <h1 className="font-editorial text-4xl">Announcement.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The popup that greets visitors. Control whether it shows, where, how often, and what it says.
      </p>
      <div className="mt-8">
        <AnnouncementEditor initial={settings} />
      </div>
    </div>
  );
}
