import { redirect } from "next/navigation";
import { requireStudioAccess, atLeast } from "@/lib/roles";
import { getAllTeasers } from "@/lib/teasers-server";
import { TeasersClient } from "./teasers-client";

export const metadata = { title: "Teasers — ADAB Studio" };

export default async function TeasersPage() {
  const actor = await requireStudioAccess();
  if (!atLeast(actor.role, "admin")) redirect("/studio");
  const teasers = await getAllTeasers();
  return (
    <div>
      <h1 className="font-editorial text-4xl">Teasers.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        &ldquo;Coming soon&rdquo; cards on the Shop grid. They stay hidden until you switch one to Live — use them to tease upcoming pieces.
      </p>
      <div className="mt-8">
        <TeasersClient initial={teasers} />
      </div>
    </div>
  );
}
