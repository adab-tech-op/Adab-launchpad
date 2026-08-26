"use client";

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border bg-[color:var(--paper)]">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <img
              src="/assets/adab-logo-lockup.svg"
              alt="ADAB"
              className="h-10 w-auto object-contain"
              loading="lazy"
            />
            <p className="mt-4 max-w-xs font-editorial text-lg leading-relaxed text-foreground/75">
              Old Soul. New Cut.
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A premium heritage-fusion menswear brand from Bangladesh — a modern reinterpretation of the piran.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-8 flex max-w-sm items-center border-b border-foreground/40 pb-2"
            >
              <input
                type="email"
                required
                placeholder="your@email.com"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="text-xs uppercase tracking-[0.18em] text-foreground hover:text-primary"
              >
                Notify me →
              </button>
            </form>
          </div>

          <FooterCol
            title="Shop"
            links={[
              { to: "/latest", label: "Latest" },
              { to: "/shop", label: "Piran" },
              { to: "/shop", label: "Hoodie" },
            ]}
          />
          <FooterCol
            title="Brand"
            links={[
              { to: "/manifesto", label: "Manifesto" },
              { to: "/scrapbook", label: "Scrapbook" },
              { to: "/contact", label: "Contact" },
            ]}
          />
          <FooterCol
            title="Help"
            links={[
              { to: "/care-guide", label: "Care Guide" },
              { to: "/contact", label: "Support" },
              { to: "/contact", label: "Shipping & Returns" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { to: "/policies/privacy", label: "Privacy Policy" },
              { to: "/policies/terms", label: "Terms of Service" },
              { to: "/policies/refund", label: "Refund & Returns" },
            ]}
          />
        </div>

        <div className="mt-16 flex flex-col-reverse gap-6 border-t border-border pt-8 text-xs tracking-wide text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ADAB. Dhaka, Bangladesh.</p>
          <div className="flex flex-wrap gap-6">
            <a href="#" className="hover:text-foreground">Instagram</a>
            <a href="#" className="hover:text-foreground">Facebook</a>
            <Link href="/policies/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/policies/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/policies/refund" className="hover:text-foreground">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-[0.2em] text-foreground/70 font-sans">
        {title}
      </h4>
      <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.to} className="hover:text-foreground transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
