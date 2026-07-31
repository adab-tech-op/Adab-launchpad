"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/adab-logo.png.asset.json";
import { CartModal } from "./CartModal";
import { SearchModal } from "./SearchModal";
import { MobileNavModal } from "./MobileNavModal";
import { useCart } from "@/context/CartContext";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/shop", label: "Drop 01" },
  { to: "/manifesto", label: "Manifesto" },
  { to: "/care-guide", label: "Care" },
  { to: "/scrapbook", label: "Scrapbook" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrollState, setScrollState] = useState(false);
  const { count } = useCart();

  const pathname = usePathname();
  const isHome = pathname === "/";
  const scrolled = isHome ? scrollState : true;

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrollState(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-300 ease-out",
          scrolled
            ? "bg-white/95 backdrop-blur-md text-foreground"
            : "bg-transparent text-white"
        )}
      >
        <div className="relative mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:px-8">
          <button
            onClick={() => setOpen(true)}
            className={cn(
              "-ml-2 justify-self-start p-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 md:hidden",
              scrolled ? "text-foreground" : "text-white"
            )}
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
              src={logoAsset.url}
              alt="ADAB"
              className={cn(
                "h-[2.275rem] w-auto object-contain transition-all duration-300 md:h-[2.6rem]",
                scrolled ? "filter-none" : "brightness-0 invert"
              )}
              loading="eager"
            />
          </Link>

          <nav className="hidden min-w-0 items-center justify-center gap-8 text-[13px] tracking-wide md:flex">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.label}
                  href={n.to}
                  className={cn(
                    "transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4",
                    active
                      ? "text-primary"
                      : scrolled
                        ? "text-foreground/80 hover:text-primary"
                        : "text-white/80 hover:text-white"
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center justify-self-end gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                "p-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                scrolled ? "text-foreground hover:text-primary" : "text-white hover:text-white/70"
              )}
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className={cn(
                "relative p-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                scrolled ? "text-foreground hover:text-primary" : "text-white hover:text-white/70"
              )}
              aria-label="Cart"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground tabular-nums">
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
