import { redirect } from "next/navigation";
import { requireStudioAccess, atLeast } from "@/lib/roles";
import { getScrapbookImages } from "@/lib/scrapbook-server";
import { ScrapbookAdmin } from "./scrapbook-admin";

export const metadata = { title: "Scrapbook — ADAB Studio" };

export default async function StudioScrapbookPage() {
  const actor = await requireStudioAccess();
  if (!atLeast(actor.role, "admin")) redirect("/studio");
  const images = await getScrapbookImages();

  return (
    <div>
      <h1 className="font-editorial text-4xl">Scrapbook.</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Upload the images shown on the public Scrapbook page. Lower sort numbers appear first.
      </p>
      <div className="mt-8">
        <ScrapbookAdmin initial={images} />
      </div>
    </div>
  );
}
