"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./SignOutButton";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountSidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  return (
    <aside className="lg:sticky lg:top-24 h-fit">
      <p className="font-editorial text-2xl leading-tight">{name}</p>
      <p className="mt-1 text-xs text-muted-foreground break-all">{email}</p>
      <nav className="mt-8 flex flex-row flex-wrap gap-x-6 gap-y-2 lg:flex-col lg:gap-1">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm transition-colors lg:rounded-md lg:px-3 lg:py-2",
                active
                  ? "text-primary lg:bg-[color:var(--paper)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 lg:mt-8">
        <SignOutButton />
      </div>
    </aside>
  );
}
