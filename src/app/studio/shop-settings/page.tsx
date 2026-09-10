import { redirect } from "next/navigation";
import { requireStudioAccess, atLeast } from "@/lib/roles";
import { getDropWindowDays, getAllowMultiOrder } from "@/lib/settings-server";
import { ShopSettingsClient } from "./shop-settings-client";

export const metadata = { title: "Shop settings — ADAB Studio" };

export default async function ShopSettingsPage() {
  const actor = await requireStudioAccess();
  if (!atLeast(actor.role, "admin")) redirect("/studio");
  const [dropWindow, allowMulti] = await Promise.all([getDropWindowDays(), getAllowMultiOrder()]);
  return (
    <div>
      <h1 className="font-editorial text-4xl">Shop settings.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Drop timing and ordering rules for the catalog.</p>
      <div className="mt-8 max-w-lg">
        <ShopSettingsClient dropWindow={dropWindow} allowMulti={allowMulti} />
      </div>
    </div>
  );
}
