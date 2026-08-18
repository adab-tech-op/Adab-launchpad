"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { CartProvider } from "@/context/CartContext";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterModal } from "@/components/site/NewsletterModal";
import { ScrollReveal } from "@/components/site/ScrollReveal";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <SiteHeader />
        <NewsletterModal />
        <ScrollReveal />
        <main className={isHome ? "" : "pt-16"}>{children}</main>
        <SiteFooter />
        <Toaster />
      </CartProvider>
    </QueryClientProvider>
  );
}
