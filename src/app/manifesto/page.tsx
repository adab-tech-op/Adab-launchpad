import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Minus, Forward, MapPin, type LucideIcon } from "lucide-react";
import { getManifestoContent } from "@/lib/page-content-server";
import { ROMAN } from "@/lib/page-content";
import { renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "The Adab Manifesto & History — Old Soul. New Cut.",
  description:
    "Adab reinterprets the piran, a short-hemmed shirt worn across East Bengal in the 1950s-60s. Heritage-fusion menswear made in Bangladesh.",
};

export const revalidate = 60; // ISR: admin edits appear within ~1 min

const VALUE_ICONS: LucideIcon[] = [BookOpen, Minus, Forward, MapPin];

export default async function Manifesto() {
  const content = await getManifestoContent();

  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="bg-foreground text-background px-5 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <p className="font-display text-[11px] uppercase tracking-[0.22em] text-background/60">Manifesto &amp; History</p>
          <h1 className="mt-6 font-editorial text-4xl md:text-6xl lg:text-7xl leading-[1.1]">
            We don&rsquo;t believe history gets lost.
            <br />
            It just waits.
          </h1>
        </div>
      </section>

      {/* Four-part story */}
      <section className="mx-auto max-w-4xl px-5 py-24 md:py-32">
        <div className="space-y-20 md:space-y-28">
          {content.storyParts.map((part, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr] gap-6 md:gap-12">
              <p className="font-display text-xl md:text-2xl text-primary tabular-nums">{ROMAN[i] ?? i + 1}.</p>
              <div>
                <h2 className="font-display text-lg md:text-xl uppercase tracking-[0.18em]">{part.title}</h2>
                <div
                  className="prose-editorial mt-4 text-base md:text-lg leading-relaxed text-foreground/85"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(part.body) }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pull quote */}
      <section className="border-y border-border bg-paper px-5 py-20 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <blockquote className="font-editorial text-3xl md:text-5xl leading-[1.15] text-foreground">
            &ldquo;The piran&rsquo;s shape is like today&rsquo;s panjabi — but shorter.&rdquo;
          </blockquote>
          <p className="mt-8 font-display text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Rajshekhar Basu, &ldquo;Our Clothing&rdquo; (Amader Parichhad), 1958
          </p>
        </div>
      </section>

      {/* Values grid */}
      <section className="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.values.map((value, i) => {
            const Icon = VALUE_ICONS[i] ?? Minus;
            return (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                <h3 className="mt-6 font-display text-sm uppercase tracking-[0.16em]">{value.title}</h3>
                <div
                  className="prose-editorial mt-3 text-sm leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(value.body) }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Closing line */}
      <section className="mx-auto max-w-4xl px-5 pb-24 md:pb-32 text-center">
        <p className="font-editorial text-3xl md:text-5xl leading-[1.15] text-foreground">
          Old soul. New cut.
          <br />
          Shorter hem, longer story — that&rsquo;s Adab.
        </p>
        <Link
          href="/shop"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 font-display text-[11px] uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Shop the Drop
        </Link>
      </section>
    </div>
  );
}
