"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { createFabricType, updateFabricType, deleteFabricType } from "@/lib/actions/fabrics";
import type { FabricType } from "@/lib/fabrics";

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground";

function FabricRow({ fabric }: { fabric: FabricType }) {
  const router = useRouter();
  const [name, setName] = useState(fabric.name);
  const [care, setCare] = useState(fabric.care_detail);
  const [pending, start] = useTransition();

  const dirty = name !== fabric.name || care !== fabric.care_detail;

  const save = () =>
    start(async () => {
      const res = await updateFabricType(fabric.id, { name, care_detail: care, sort_order: fabric.sort_order });
      if (res.ok) { toast.success("Saved"); router.refresh(); }
      else toast.error(res.error);
    });

  const remove = () =>
    start(async () => {
      if (!confirm(`Delete "${fabric.name}"? Products using it will fall back to the standard care copy.`)) return;
      const res = await deleteFabricType(fabric.id);
      if (res.ok) { toast.success("Deleted"); router.refresh(); }
      else toast.error(res.error);
    });

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-center gap-3">
        <input className={`${inputCls} font-medium`} value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={remove} disabled={pending} className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:text-red-600" aria-label="Delete fabric">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <label className="mt-3 block">
        <span className={labelCls}>Care guide</span>
        <textarea className={`${inputCls} mt-1 resize-y`} rows={3} value={care} onChange={(e) => setCare(e.target.value)} />
      </label>
      <button
        onClick={save}
        disabled={pending || !dirty}
        className="mt-3 rounded-full bg-foreground px-4 py-1.5 text-sm text-background disabled:opacity-40"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export function FabricsClient({ initial }: { initial: FabricType[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [care, setCare] = useState("");
  const [pending, start] = useTransition();

  const add = () =>
    start(async () => {
      const res = await createFabricType({ name, care_detail: care });
      if (res.ok) {
        toast.success("Fabric added");
        setName("");
        setCare("");
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div className="space-y-6">
      {/* Add new */}
      <div className="rounded-xl border border-dashed border-border p-5">
        <p className={labelCls}>New fabric type</p>
        <input className={`${inputCls} mt-2`} placeholder="Fabric name (e.g. Silk)" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className={`${inputCls} mt-2 resize-y`} rows={3} placeholder="Care guide for this fabric…" value={care} onChange={(e) => setCare(e.target.value)} />
        <button
          onClick={add}
          disabled={pending || name.trim() === ""}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-1.5 text-sm text-background disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Add fabric
        </button>
      </div>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">No fabric types yet. Add your first above.</p>
      ) : (
        <div className="space-y-4">
          {initial.map((f) => (
            <FabricRow key={f.id} fabric={f} />
          ))}
        </div>
      )}
    </div>
  );
}
