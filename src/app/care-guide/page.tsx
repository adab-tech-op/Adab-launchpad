import type { Metadata } from "next";
import Link from "next/link";
import { Droplets, Wind, Flame, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Care Guide — Adab",
  description:
    "Simple, practical care for your Adab pieces — washing, drying, ironing, and storage.",
};

const SECTIONS = [
  {
    icon: Droplets,
    title: "Washing",
    body: "Wash cold, turn inside out, and use a gentle detergent. Wash similar colors together to keep tones true.",
  },
  {
    icon: Wind,
    title: "Drying",
    body: "Dry in the shade. Avoid direct sunlight for long stretches. Avoid tumble drying unless the care label allows it.",
  },
  {
    icon: Flame,
    title: "Ironing",
    body: "Iron inside out on medium heat. Keep the iron away from the embroidery to protect the raised threadwork.",
  },
  {
    icon: Package,
    title: "Storage",
    body: "Hang structured pieces. Fold heavier garments to keep their shape. Store somewhere cool and dry.",
  },
];

export default function CareGuide() {
  return (
    <div className="mx-auto max-w-4xl px-5 md:px-8 py-24 md:py-32">
      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-primary">
        Care
      </p>
      <h1 className="mt-4 font-sans text-5xl md:text-6xl leading-[0.95]">
        Care Guide.
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
        Adab pieces are designed for repeat wear. Care for them gently and
        they'll stay with you longer.
      </p>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTIONS.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-border p-8 paper-grain"
          >
            <s.icon className="h-6 w-6 text-primary" strokeWidth={1.25} />
            <h2 className="mt-6 font-sans text-2xl">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {s.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-20 text-center">
        <p className="text-sm text-muted-foreground">
          Have a care question?{" "}
          <Link
            href="/contact"
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            Contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
