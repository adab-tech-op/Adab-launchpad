"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./SignOutButton";

const LINKS = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/orders", label: "Orders" },
  { href: "/studio/inbox", label: "Inbox" },
  { href: "/studio/products", label: "Products" },
  { href: "/studio/notify", label: "Notify list" },
];

export function StudioSidebar() {
  const pathname = usePathname();
  return (
    <aside className="lg:sticky lg:top-24 h-fit">
      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-primary">ADAB Studio</p>
      <p className="mt-1 text-xs text-muted-foreground">Admin</p>
      <nav className="mt-8 flex flex-row flex-wrap gap-x-6 gap-y-2 lg:flex-col lg:gap-1">
        {LINKS.map((l) => {
          const active = l.href === "/studio" ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm transition-colors lg:rounded-md lg:px-3 lg:py-2",
                active ? "text-primary lg:bg-[color:var(--paper)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 lg:mt-8 space-y-3">
        <Link href="/" className="block text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
          ← View site
        </Link>
        <SignOutButton />
      </div>
    </aside>
  );
}
