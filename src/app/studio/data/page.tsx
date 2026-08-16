import { AlertTriangle } from "lucide-react";
import { requireRootPage } from "@/lib/roles";
import { DangerZone } from "./danger-client";

export const metadata = { title: "Data — ADAB Studio" };

export default async function DataPage() {
  await requireRootPage();

  return (
    <div>
      <h1 className="font-editorial text-4xl">Data.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Reset tools for clearing test data before launch. Root admins only.
      </p>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" strokeWidth={1.75} />
        <p className="text-muted-foreground leading-relaxed">
          These actions permanently delete data and cannot be undone. Each one requires typing
          <span className="mx-1 font-medium text-foreground">DELETE</span> to confirm, and every run is recorded in Activity.
          Once you have real customers, prefer clearing scoped data over wiping everything.
        </p>
      </div>

      <div className="mt-8">
        <DangerZone />
      </div>
    </div>
  );
}
