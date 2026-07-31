import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Minus, Forward, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "The Adab Manifesto — Old Soul. New Cut.",
  description:
    "Adab reinterprets the piran, a short-hemmed shirt worn across East Bengal in the 1950s-60s. Heritage-fusion menswear made in Bangladesh.",
};

const storyParts = [
  {
    numeral: "I.",
    title: "ORIGIN TENSION",
    body: "Bangladeshi men have had two options: Western clothing that isn't really theirs, or the panjabi — reserved for occasions. Nothing to wear every day that carries their own history.",
  },
  {
    numeral: "II.",
    title: "THE HERITAGE",
    body: "In the mid-20th century, men across East Bengal — today's Bangladesh — wore a short-hemmed, full-sleeve shirt called the piran. In 1958, Bengali writer Rajshekhar Basu wrote: 'The piran's shape is like today's panjabi — but shorter.'",
  },
  {
    numeral: "III.",
    title: "THE BRIDGE",
    body: "The piran never disappeared — it evolved into today's longer panjabi. Our attention simply drifted elsewhere. Adab reinterprets that specific moment of evolution in today's cut, fabric, and embroidery.",
  },
  {
    numeral: "IV.",
    title: "THE PROMISE",
    body: "Wearing Adab isn't bringing something back. It's writing the next chapter. Your own history, in today's language.",
  },
];

const values = [
  {
    icon: BookOpen,
    title: "Truth",
    body: "Every historical claim is source-backed. If we can't prove it, we don't say it.",
  },
  {
    icon: Minus,
    title: "Restraint",
    body: "Tonal embroidery, no loud logos, no public discounts. Restraint is the luxury.",
  },
  {
    icon: Forward,
    title: "Forward Heritage",
    body: "The past is our material, not our destination.",
  },
  {
    icon: MapPin,
    title: "Made in Bangladesh",
    body: "Production, story, language — all homegrown.",
  },
];

export default function Manifesto() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="bg-foreground text-background px-5 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <p className="font-display text-[11px] uppercase tracking-[0.22em] text-background/60">
            Manifesto
          </p>
          <h1 className="mt-6 font-editorial text-4xl md:text-6xl lg:text-7xl leading-[1.1]">
            We don't believe history gets lost.
            <br />
            It just waits.
          </h1>
        </div>
      </section>

      {/* Four-part story */}
      <section className="mx-auto max-w-4xl px-5 py-24 md:py-32">
        <div className="space-y-20 md:space-y-28">
          {storyParts.map((part) => (
            <div
              key={part.numeral}
              className="grid grid-cols-[auto_1fr] gap-6 md:gap-12"
            >
              <p className="font-display text-xl md:text-2xl text-primary tabular-nums">
                {part.numeral}
              </p>
              <div>
                <h2 className="font-display text-lg md:text-xl uppercase tracking-[0.18em]">
                  {part.title}
                </h2>
                <p className="mt-4 text-base md:text-lg leading-relaxed text-foreground/85">
                  {part.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pull quote */}
      <section className="border-y border-border bg-paper px-5 py-20 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <blockquote className="font-editorial text-3xl md:text-5xl leading-[1.15] text-foreground">
            “The piran's shape is like today's panjabi — but shorter.”
          </blockquote>
          <p className="mt-8 font-display text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Rajshekhar Basu, “Our Clothing” (Amader Parichhad), 1958
          </p>
        </div>
      </section>

      {/* Values grid */}
      <section className="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border border-border bg-card p-6 md:p-8"
            >
              <value.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <h3 className="mt-6 font-display text-sm uppercase tracking-[0.16em]">
                {value.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {value.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing line */}
      <section className="mx-auto max-w-4xl px-5 pb-24 md:pb-32 text-center">
        <p className="font-editorial text-3xl md:text-5xl leading-[1.15] text-foreground">
          Old soul. New cut.
          <br />
          Shorter hem, longer story — that's Adab.
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
