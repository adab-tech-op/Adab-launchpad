import { requireRootPage, getAuditLog } from "@/lib/roles";
import { ActivityClient } from "./activity-client";

export const metadata = { title: "Activity — ADAB Studio" };

export default async function ActivityPage() {
  const actor = await requireRootPage();
  // Filtering and paging happen client-side, so this reads a deeper slice than
  // the old hard 300 and lets "All time" mean something.
  const entries = await getAuditLog(1000);

  return (
    <div>
      <h1 className="font-editorial text-4xl">Activity.</h1>
      <div className="mt-3">
        <ActivityClient entries={entries} selfEmail={actor.email} />
      </div>
    </div>
  );
}
