"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/context/CartContext";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterModal } from "@/components/site/NewsletterModal";
import { ScrollReveal } from "@/components/site/ScrollReveal";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <SiteHeader />
        <NewsletterModal />
        <ScrollReveal />
        <main>{children}</main>
        <SiteFooter />
        <Toaster />
      </CartProvider>
    </QueryClientProvider>
  );
}
