import { redirect } from "next/navigation";
import { requireStudioAccess, atLeast } from "@/lib/roles";
import { getManifestoContent, getCareContent } from "@/lib/page-content-server";
import { ContentEditor } from "./content-client";

export const metadata = { title: "Content — ADAB Studio" };

export default async function ContentPage() {
  const actor = await requireStudioAccess();
  if (!atLeast(actor.role, "admin")) redirect("/studio"); // moderators can't edit
  const [manifesto, care] = await Promise.all([getManifestoContent(), getCareContent()]);

  return (
    <div>
      <h1 className="font-editorial text-4xl">Content.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Edit the Manifesto and Care guide copy. Markdown supported; Bengali and English can be mixed on the same line.
      </p>
      <div className="mt-8">
        <ContentEditor manifesto={manifesto} care={care} />
      </div>
    </div>
  );
}
