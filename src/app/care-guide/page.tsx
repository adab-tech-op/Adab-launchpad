import type { Metadata } from "next";
import Link from "next/link";
import { Droplets, Wind, Flame, Package, type LucideIcon } from "lucide-react";
import { getCareContent } from "@/lib/page-content-server";
import { renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Care Guide — Adab",
  description:
    "Simple, practical care for your Adab pieces — washing, drying, ironing, and storage.",
};

export const revalidate = 60; // ISR: admin edits appear within ~1 min

const SECTION_ICONS: LucideIcon[] = [Droplets, Wind, Flame, Package];

export default async function CareGuide() {
  const content = await getCareContent();

  return (
    <div className="mx-auto max-w-4xl px-5 md:px-8 py-24 md:py-32">
      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-primary">Care</p>
      <h1 className="mt-4 font-sans text-5xl md:text-6xl leading-[0.95]">Care Guide.</h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
        Adab pieces are designed for repeat wear. Care for them gently and they&rsquo;ll stay with you longer.
      </p>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {content.sections.map((s, i) => {
          const Icon = SECTION_ICONS[i] ?? Package;
          return (
            <div key={i} className="rounded-2xl border border-border p-8 paper-grain">
              <Icon className="h-6 w-6 text-primary" strokeWidth={1.25} />
              <h2 className="mt-6 font-sans text-2xl">{s.title}</h2>
              <div
                className="prose-editorial mt-3 text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(s.body) }}
              />
            </div>
          );
        })}
      </div>

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
