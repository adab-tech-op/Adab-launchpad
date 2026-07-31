"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const ENTER: Record<string, string> = {
  center: "animate-in fade-in zoom-in-95 duration-200",
  top: "animate-in fade-in slide-in-from-top-8 duration-300 ease-out",
  right: "animate-in fade-in slide-in-from-right-12 duration-300 ease-out",
  left: "animate-in fade-in slide-in-from-left-12 duration-300 ease-out",
};

export function ModalShell({
  open,
  onClose,
  children,
  className,
  labelledBy,
  from = "center",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  from?: "center" | "top" | "right" | "left";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl bg-background shadow-[0_24px_70px_-20px_rgba(0,0,0,0.45)]",
          ENTER[from],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
