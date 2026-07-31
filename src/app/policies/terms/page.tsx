import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — ADAB",
  description:
    "The terms that apply when you use adab.co, reserve a piece, or place an order.",
  openGraph: {
    title: "Terms of Service — ADAB",
    description: "The terms that apply when you use adab.co or reserve a piece.",
  },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 md:px-8 py-16 md:py-24">
      <p className="text-[11px] uppercase tracking-[0.24em] text-primary font-display">
        Policies
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </p>

      <div className="mt-12 space-y-10 text-[15px] leading-[1.8] text-foreground/85">
        <Section title="Using the site">
          <p>
            By browsing adab.co, joining the waitlist, or reserving a piece,
            you agree to these terms. If you don't agree, please don't use
            the site.
          </p>
        </Section>

        <Section title="Reservations and orders">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Our Founding Drop is sold on a reservation model. Submitting
              a reservation is a request, not a confirmed order.
            </li>
            <li>
              We'll message you on WhatsApp or bKash within 24 hours to
              confirm size availability, final price, delivery, and payment
              details.
            </li>
            <li>
              Your reservation is only secured after advance payment is
              received and confirmed.
            </li>
            <li>
              Quantities are limited and there is no guaranteed restock. We
              may cancel a reservation if a piece sells out before payment
              clears; in that case any advance payment is refunded in full.
            </li>
          </ul>
        </Section>

        <Section title="Pricing and payment">
          <ul className="list-disc pl-5 space-y-2">
            <li>Prices are shown in Bangladeshi Taka (BDT).</li>
            <li>Payment is currently accepted through bKash. Other methods will be added later.</li>
            <li>Delivery charges are confirmed when we reach out about your reservation.</li>
          </ul>
        </Section>

        <Section title="Shipping">
          <p>
            We ship across Bangladesh through third-party couriers. Delivery
            times depend on your location and the courier. We're not
            responsible for delays caused by the courier, weather, or
            circumstances outside our control, but we'll help you follow up
            when things go wrong.
          </p>
        </Section>

        <Section title="Returns">
          <p>
            Return terms are covered in our{" "}
            <Link href="/policies/refund" className="text-primary underline underline-offset-4">
              Refund Policy
            </Link>
            .
          </p>
        </Section>

        <Section title="Product images and descriptions">
          <p>
            We photograph our pieces carefully, but colours and textures can
            look slightly different on different screens. Small variations
            in embroidery and fabric are part of how our pieces are made and
            are not defects.
          </p>
        </Section>

        <Section title="Intellectual property">
          <p>
            The ADAB name, logo, product designs, photography, and written
            content on this site belong to ADAB. Please don't copy or reuse
            them without our written permission.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            We do our best to keep the site accurate and running. We're not
            liable for indirect or consequential losses that come from using
            the site or a product beyond what applicable Bangladeshi law
            requires.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update these terms as the brand grows. When we do, we'll
            update the date at the top of this page. Continuing to use the
            site after changes means you accept the updated terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions? Email{" "}
            <a className="text-primary underline underline-offset-4" href="mailto:hello@adab.co">
              hello@adab.co
            </a>
            .
          </p>
        </Section>

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

