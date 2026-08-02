"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct } from "@/lib/actions/products-admin";

export function DeleteProductButton({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const onDelete = async () => {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    setBusy(true);
    const res = await deleteProduct(slug);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Product deleted");
    router.refresh();
  };
  return (
    <button onClick={onDelete} disabled={busy} className="text-muted-foreground hover:text-destructive disabled:opacity-50" aria-label={`Delete ${name}`}>
      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );
}
