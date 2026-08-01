import Link from "next/link";
import type { ReactNode } from "react";

export const authInput =
  "w-full rounded-md border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-20">
      <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
      <h1 className="mt-3 font-editorial text-4xl leading-tight">{title}</h1>
      {subtitle && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
      <div className="mt-8">{children}</div>
      {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
      <p className="mt-10 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">← Back to ADAB</Link>
      </p>
    </div>
  );
}

export function authLabel(label: string) {
  return (
    <span className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </span>
  );
}
