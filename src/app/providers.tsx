"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/context/CartContext";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterModal } from "@/components/site/NewsletterModal";
import { WelcomeModal } from "@/components/site/WelcomeModal";
import { ScrollReveal } from "@/components/site/ScrollReveal";
import { Toaster } from "@/components/ui/sonner";

/** Auth routes, which are the only pages reachable while the site is closed. */
const AUTH_PREFIXES = ["/signin", "/signup", "/forgot-password", "/reset-password"];

export function Providers({ children, isolated = false }: { children: ReactNode; isolated?: boolean }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname() ?? "";

  // While the site is closed, the gate should be a gate — not the storefront
  // with a login form in the middle of it. Showing the full nav to someone who
  // cannot open any of it advertises the site's structure and invites clicks
  // that only bounce back. (It is also the header whose logo was the bypass.)
  // Once isolation is off, sign-in looks like a normal page again.
  const bare = isolated && AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {!bare && <SiteHeader />}
        {!bare && <NewsletterModal />}
        <WelcomeModal />
        <ScrollReveal />
        <main>{children}</main>
        {!bare && <SiteFooter />}
        <Toaster />
      </CartProvider>
    </QueryClientProvider>
  );
}
