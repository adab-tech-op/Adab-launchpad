import { redirect } from "next/navigation";
import { requireStudioAccess, atLeast } from "@/lib/roles";
import { getBanner } from "@/lib/settings-server";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings — ADAB Studio" };

export default async function SettingsPage() {
  const actor = await requireStudioAccess();
  if (!atLeast(actor.role, "admin")) redirect("/studio");
  const banner = await getBanner();
  return (
    <div>
      <h1 className="font-editorial text-4xl">Settings.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Site-wide controls. Drop timing &amp; ordering live under Catalog → Shop settings.</p>
      <div className="mt-8 max-w-lg">
        <SettingsClient banner={banner} />
      </div>
    </div>
  );
}
