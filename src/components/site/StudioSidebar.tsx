"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./SignOutButton";
import type { Role } from "@/lib/roles";

type NavLink = { href: string; label: string; minRole?: Role };

const RANK: Record<Role, number> = { moderator: 1, admin: 2, root: 3 };

// minRole: the lowest role that sees the link. Notify holds PII (admin+); Team &
// Activity are root-only. Others are visible to all studio roles.
const LINKS: NavLink[] = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/orders", label: "Orders" },
  { href: "/studio/inbox", label: "Inbox" },
  { href: "/studio/products", label: "Products" },
  { href: "/studio/notify", label: "Notify list", minRole: "admin" },
  { href: "/studio/announcement", label: "Announcement", minRole: "admin" },
  { href: "/studio/content", label: "Content", minRole: "admin" },
  { href: "/studio/team", label: "Team", minRole: "root" },
  { href: "/studio/activity", label: "Activity", minRole: "root" },
  { href: "/studio/data", label: "Data", minRole: "root" },
];

const ROLE_LABEL: Record<Role, string> = { root: "Root admin", admin: "Admin", moderator: "Moderator" };

export function StudioSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => !l.minRole || RANK[role] >= RANK[l.minRole]);
  return (
    <aside className="lg:sticky lg:top-24 h-fit">
      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-primary">ADAB Studio</p>
      <p className="mt-1 text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
      <nav className="mt-8 flex flex-row flex-wrap gap-x-6 gap-y-2 lg:flex-col lg:gap-1">
        {links.map((l) => {
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
