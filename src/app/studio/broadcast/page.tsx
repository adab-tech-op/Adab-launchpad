import { redirect } from "next/navigation";
import { requireStudioAccess, atLeast } from "@/lib/roles";
import { getBroadcastRecipients } from "@/lib/broadcast-server";
import { BroadcastClient } from "./broadcast-client";

export const metadata = { title: "Broadcast — ADAB Studio" };

export default async function BroadcastPage() {
  const actor = await requireStudioAccess();
  if (!atLeast(actor.role, "admin")) redirect("/studio");
  const recipients = await getBroadcastRecipients();

  return (
    <div>
      <h1 className="font-editorial text-4xl">Broadcast.</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Send an offer to your list — newsletter signups and buyers who opted in, minus anyone who
        unsubscribed. Sends from <strong>offers@adab.world</strong> with a one-click unsubscribe.
        Always send yourself a test first.
      </p>
      <div className="mt-8">
        <BroadcastClient recipientCount={recipients.length} selfEmail={actor.email} />
      </div>
    </div>
  );
}
