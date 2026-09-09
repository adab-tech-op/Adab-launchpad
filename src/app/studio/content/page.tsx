import { redirect } from "next/navigation";
import { requireStudioAccess, atLeast } from "@/lib/roles";
import { getManifestoContent, getCareContent, getHomeContent, getDropContent, getShopContent, getContactContent } from "@/lib/page-content-server";
import { ContentEditor } from "./content-client";

export const metadata = { title: "Content — ADAB Studio" };

export default async function ContentPage() {
  const actor = await requireStudioAccess();
  if (!atLeast(actor.role, "admin")) redirect("/studio"); // moderators can't edit
  const [manifesto, care, home, drop, shop, contact] = await Promise.all([
    getManifestoContent(), getCareContent(), getHomeContent(), getDropContent(), getShopContent(), getContactContent(),
  ]);

  return (
    <div>
      <h1 className="font-editorial text-4xl">Content.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Edit the copy and heroes across Home, Drop, Shop, Manifesto, Care guide, and Contact. Markdown supported where noted; Bengali and English can be mixed.
      </p>
      <div className="mt-8">
        <ContentEditor manifesto={manifesto} care={care} home={home} drop={drop} shop={shop} contact={contact} />
      </div>
    </div>
  );
}
