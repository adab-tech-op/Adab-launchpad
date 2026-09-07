import { redirect } from "next/navigation";
import { requireStudioAccess, atLeast } from "@/lib/roles";
import { getDropWindowDays, getBanner, getAllowMultiOrder } from "@/lib/settings-server";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings — ADAB Studio" };

export default async function SettingsPage() {
  const actor = await requireStudioAccess();
  if (!atLeast(actor.role, "admin")) redirect("/studio"); // moderators can't edit
  const [dropWindow, banner, allowMulti] = await Promise.all([getDropWindowDays(), getBanner(), getAllowMultiOrder()]);

  return (
    <div>
      <h1 className="font-editorial text-4xl">Settings.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Site-wide controls. More options will land here as they&rsquo;re built.
      </p>
      <div className="mt-8 max-w-lg">
        <SettingsClient dropWindow={dropWindow} banner={banner} allowMulti={allowMulti} />
      </div>
    </div>
  );
}
