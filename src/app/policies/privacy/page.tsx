import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — ADAB",
  description:
    "How ADAB collects, uses, and protects your information when you shop with us or join the waitlist.",
  openGraph: {
    title: "Privacy Policy — ADAB",
    description: "How ADAB collects, uses, and protects your information.",
  },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 md:px-8 py-16 md:py-24">
      <p className="text-[11px] uppercase tracking-[0.24em] text-primary font-display">
        Policies
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </p>

      <div className="mt-12 space-y-10 text-[15px] leading-[1.8] text-foreground/85">
        <Section title="Who we are">
          <p>
            ADAB is a heritage-fusion menswear brand based in Dhaka,
            Bangladesh. This policy explains what information we collect when
            you visit adab.co, join our waitlist, or place a reservation, and
            how we use it.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Contact details</strong> you give us — name, email,
              phone number, and delivery address — when you join the waitlist
              or confirm a reservation.
            </li>
            <li>
              <strong>Order details</strong> — the product, size, and
              quantity you reserve, along with any notes you add.
            </li>
            <li>
              <strong>Messages</strong> you send us through the contact form,
              email, WhatsApp, or Instagram.
            </li>
            <li>
              <strong>Basic technical data</strong> your browser sends
              automatically (device type, approximate location, pages
              visited) so we can keep the site running.
            </li>
          </ul>
        </Section>

        <Section title="How we use it">
          <ul className="list-disc pl-5 space-y-2">
            <li>To confirm reservations and coordinate bKash payment and delivery.</li>
            <li>To notify you about the Founding Drop and future releases if you joined the waitlist.</li>
            <li>To answer questions you send us.</li>
            <li>To improve the site and understand what our customers care about.</li>
          </ul>
        </Section>

        <Section title="Who sees your information">
          <p>
            We don't sell your data. We share it only with the services we
            need to run the shop — for example our hosting and database
            provider, our email tools, and delivery partners who need your
            address to bring your order to you.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep reservation and order records for as long as we need them
            for accounting and customer service. Waitlist emails stay on our
            list until you unsubscribe.
          </p>
        </Section>

        <Section title="Your choices">
          <ul className="list-disc pl-5 space-y-2">
            <li>You can unsubscribe from waitlist emails at any time.</li>
            <li>You can ask us for a copy of the information we hold about you, or ask us to delete it.</li>
            <li>Write to <a className="text-primary underline underline-offset-4" href="mailto:hello@adab.co">hello@adab.co</a> for either.</li>
          </ul>
        </Section>

        <Section title="Cookies">
          <p>
            We use a small number of cookies to keep the site working (for
            example, remembering what's in your cart). We don't run
            third-party advertising trackers.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy? Email{" "}
            <a className="text-primary underline underline-offset-4" href="mailto:hello@adab.co">
              hello@adab.co
            </a>{" "}
            or use our{" "}
            <Link href="/contact" className="text-primary underline underline-offset-4">
              contact page
            </Link>
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
      This is plain-language draft copy. Have a Bangladesh-qualified lawyer
      review before publishing — especially anything touching data-protection
      compliance, cross-border transfers, and specific retention periods.
    </aside>
  );
}
