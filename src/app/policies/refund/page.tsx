import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund & Returns — ADAB",
  description:
    "How returns, exchanges, and refunds work on ADAB Founding Drop pieces.",
  openGraph: {
    title: "Refund & Returns — ADAB",
    description: "How returns, exchanges, and refunds work on ADAB pieces.",
  },
};

export default function RefundPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 md:px-8 py-16 md:py-24">
      <p className="text-[11px] uppercase tracking-[0.24em] text-primary font-display">
        Policies
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Refund &amp; Returns</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </p>

      <div className="mt-12 space-y-10 text-[15px] leading-[1.8] text-foreground/85">
        <Section title="The short version">
          <p>
            Founding Drop pieces are made in limited quantities. We want you
            to love yours — if something's wrong on our side, we'll make it
            right. If you simply change your mind, we offer size exchanges
            rather than refunds.
          </p>
        </Section>

        <Section title="Size exchanges">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              You can request a size exchange within <strong>7 days</strong>{" "}
              of receiving your piece.
            </li>
            <li>The piece must be unworn, unwashed, and in its original packaging with tags intact.</li>
            <li>
              Exchanges depend on stock. If your size isn't available, we'll
              issue store credit for a future drop.
            </li>
            <li>Return shipping to us is the customer's responsibility; we cover shipping the exchanged piece back to you inside Bangladesh.</li>
          </ul>
        </Section>

        <Section title="Damaged or wrong item">
          <p>
            If your piece arrives damaged or you receive the wrong size or
            product, tell us within 48 hours of delivery with photos. We'll
            arrange a replacement or a full refund, including delivery
            charges.
          </p>
        </Section>

        <Section title="Refunds">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Once approved, refunds are issued to the original bKash number
              (or account) used for payment.
            </li>
            <li>Please allow up to 7 working days for the refund to reach you.</li>
            <li>
              Handmade embroidery may vary slightly piece to piece. Small
              natural variations aren't considered defects and aren't
              eligible for refund.
            </li>
          </ul>
        </Section>

        <Section title="Not eligible for return or exchange">
          <ul className="list-disc pl-5 space-y-2">
            <li>Pieces that have been worn, washed, altered, or damaged after delivery.</li>
            <li>Items returned without prior confirmation from us.</li>
            <li>Sale or archive pieces marked "final sale."</li>
          </ul>
        </Section>

        <Section title="How to start a return">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Message us on WhatsApp or email{" "}
              <a className="text-primary underline underline-offset-4" href="mailto:hello@adab.co">
                hello@adab.co
              </a>{" "}
              with your order details and reason.
            </li>
            <li>We'll confirm eligibility and share the return address.</li>
            <li>Ship the piece back using a trackable courier and share the tracking number with us.</li>
            <li>Once we receive and inspect the piece, we'll arrange the exchange or refund.</li>
          </ol>
        </Section>

        <Section title="Contact">
          <p>
            Questions before you buy? Reach us through the{" "}
            <Link href="/contact" className="text-primary underline underline-offset-4">
              contact page
            </Link>{" "}
            or on Instagram{" "}
            <a
              className="text-primary underline underline-offset-4"
              href="https://instagram.com/adab.co"
              target="_blank"
              rel="noreferrer"
            >
              @adab.co
            </a>
            .
          </p>
        </Section>

        <LegalReviewNote />
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl md:text-2xl text-foreground">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function LegalReviewNote() {
  return (
    <aside className="rounded-lg border border-dashed border-border bg-[color:var(--paper)] p-5 text-xs text-muted-foreground leading-relaxed">
      <strong className="text-foreground">Note for the ADAB team:</strong>{" "}
      The return window (7 days), damage-report window (48 hours), and
      refund method (bKash only) are placeholders that should match what
      you can actually operationally support. Confirm with a Bangladesh-qualified
      lawyer that this satisfies local consumer-protection requirements before
      publishing.
    </aside>
  );
}
