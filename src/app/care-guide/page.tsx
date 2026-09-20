import type { Metadata } from "next";
import Link from "next/link";
import { getCareContent } from "@/lib/page-content-server";
import { getFabricTypes } from "@/lib/fabrics-server";
import { FabricCareGrid } from "./fabric-care";

export const metadata: Metadata = {
  title: "Care Guide — Adab",
  description:
    "Simple, practical care for your Adab pieces — washing, drying, ironing, and storage, fabric by fabric.",
};

export const revalidate = 60; // ISR: admin edits appear within ~1 min

export default async function CareGuide() {
  const [content, fabrics] = await Promise.all([getCareContent(), getFabricTypes()]);

  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8 py-24 md:py-32">
      <h1 className="mt-4 font-sans text-5xl md:text-6xl leading-[0.95]">{content.heading}</h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">{content.subcopy}</p>

      {/* The generic Washing/Drying/Ironing/Storage cards used to sit here.
          They said the same four vague things on every visit while the
          per-fabric popup below answers the same four questions specifically —
          two answers to one question, with the vaguer one higher on the page.
          The stored `sections` content is untouched in the DB. */}

      {fabrics.length > 0 && (
        <div className="mt-14">
          <FabricCareGrid fabrics={fabrics} />
        </div>
      )}

      <div className="mt-20 text-center">
        <p className="text-sm text-muted-foreground">
          Have a care question?{" "}
          <Link href="/contact" className="text-foreground underline underline-offset-4 hover:text-primary">
            Contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
