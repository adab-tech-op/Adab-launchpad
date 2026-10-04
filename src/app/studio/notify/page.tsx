import { redirect } from "next/navigation";
import { getNotifyList } from "@/lib/studio";
import { requireStudioAccess, canSeePII } from "@/lib/roles";
import { ExportButton } from "./export-button";
import { NotifyClient } from "./notify-client";

export const metadata = { title: "Notify list — ADAB Studio" };

export default async function NotifyPage() {
  const actor = await requireStudioAccess();
  if (!canSeePII(actor.role)) redirect("/studio"); // moderators don't see the marketing/PII list
  const contacts = await getNotifyList();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-4xl">Notify list.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everyone who opted in: newsletter signups and buyers who ticked consent at checkout. Use this for drop announcements.
          </p>
        </div>
        <ExportButton contacts={contacts} />
      </div>

      <NotifyClient contacts={contacts} />

      <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
        Broadcast emails to this list must include an unsubscribe link. Transactional order emails do not use this list.
      </p>
    </div>
  );
}
