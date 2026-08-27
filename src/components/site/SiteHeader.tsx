"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { CartModal } from "./CartModal";
import { SearchModal } from "./SearchModal";
import { MobileNavModal } from "./MobileNavModal";
import { useCart } from "@/context/CartContext";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/latest", label: "Latest" },
  { to: "/manifesto", label: "Manifesto & History" },
  { to: "/care-guide", label: "Care Guide" },
  { to: "/scrapbook", label: "Scrapbook" },
  { to: "/contact", label: "Contact" },
];

// One solid, opaque bar on every page and every scroll position — no
// transparency, no backdrop-filter, no per-page colour inversion, no scroll
// listener. This is deliberate: those were the source of the cross-browser and
// per-page inconsistencies. `sticky` lets the bar occupy its own space so
// content flows below it with no offset hack.
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { count } = useCart();
  const { data: session } = useSession();
  const pathname = usePathname();

  const iconCls =
    "p-2 text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background text-foreground">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:px-8">
          <button
            onClick={() => setOpen(true)}
            className="-ml-2 justify-self-start p-2 text-foreground focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center justify-self-center md:justify-self-start"
            aria-label="ADAB home"
          >
            <img
              src="/assets/adab-logo-lockup.svg"
              alt="ADAB"
              className="h-[2.275rem] w-auto object-contain md:h-[2.6rem]"
              loading="eager"
            />
          </Link>

          <nav className="hidden min-w-0 items-center justify-center gap-6 text-[13px] tracking-wide md:flex lg:gap-8">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.label}
                  href={n.to}
                  className={cn(
                    "whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4",
                    active ? "text-primary" : "text-foreground/80 hover:text-primary"
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center justify-self-end gap-1">
            <button onClick={() => setSearchOpen(true)} className={iconCls} aria-label="Search">
              <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <Link href={session ? "/account" : "/signin"} className={iconCls} aria-label={session ? "Account" : "Sign in"}>
              <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>
            <button onClick={() => setCartOpen(true)} className={cn(iconCls, "relative")} aria-label="Cart">
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {count > 0 && (
                <span
                  key={count}
                  className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground tabular-nums animate-badge-pop"
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileNavModal open={open} onClose={() => setOpen(false)} items={NAV} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
