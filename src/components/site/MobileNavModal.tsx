"use client";

import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { ModalShell } from "./ModalShell";

export type NavItem = { to: string; label: string };

export function MobileNavModal({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
}) {
  return (
    <ModalShell open={open} onClose={onClose} labelledBy="nav-modal-title" className="max-w-sm" from="left">
      <h2 id="nav-modal-title" className="sr-only">
        Navigation
      </h2>
      <div className="relative flex items-center justify-center px-5 py-5">
        <img src="/assets/adab-logo-lockup.svg" alt="ADAB" className="h-9 w-auto object-contain" />
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-4 p-1.5 text-foreground transition-colors hover:text-primary"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
      <nav className="flex flex-col px-5 pb-6">
        {items.map((n) => (
          <Link
            key={n.label}
            href={n.to}
            onClick={onClose}
            className="flex items-center justify-between border-b border-border py-4 text-sm uppercase tracking-[0.16em] text-foreground transition-colors hover:text-primary"
          >
            <span>{n.label}</span>
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        ))}
      </nav>
    </ModalShell>
  );
}
