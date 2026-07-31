import type { Metadata } from "next";
import { ScrapbookClient } from "./scrapbook-client";

export const metadata: Metadata = {
  title: "Scrapbook — ADAB",
  description:
    "People, places, textures, and moments around Adab. Premium heritage-fusion menswear from Bangladesh.",
};

export default function ScrapbookPage() {
  return <ScrapbookClient />;
}
