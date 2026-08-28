"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { createCoupon, updateCoupon, deleteCoupon } from "@/lib/actions/coupons";

type Coupon = {
  id: number;
  code: string;
  percent: number;
  product_slug: string | null;
  active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  committed_uses: number;
};

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "text-[11px] uppercase tracking-[0.16em] text-muted-foreground";

function Row({ c, products }: { c: Coupon; products: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [active, setActive] = useState(c.active);

  const toggle = () =>
    start(async () => {
      const next = !active;
      setActive(next);
      const res = await updateCoupon(c.id, {
        code: c.code, percent: c.percent, product_slug: c.product_slug ?? "",
        active: next, expires_at: c.expires_at ? String(c.expires_at).slice(0, 10) : "", max_uses: c.max_uses,
      });
      if (res.ok) { toast.success(next ? "Activated" : "Deactivated"); router.refresh(); }
      else { setActive(!next); toast.error(res.error); }
    });

  const remove = () =>
    start(async () => {
      if (!confirm(`Delete code ${c.code}?`)) return;
      const res = await deleteCoupon(c.id);
      if (res.ok) { toast.success("Deleted"); router.refresh(); }
      else toast.error(res.error);
    });

  const scope = c.product_slug ? (products.find((p) => p.slug === c.product_slug)?.name ?? c.product_slug) : "All products";
  const cap = c.max_uses != null ? `${c.committed_uses}/${c.max_uses} used` : `${c.committed_uses} used`;
  const expiry = c.expires_at ? `· ends ${String(c.expires_at).slice(0, 10)}` : "";

  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-4">
      <div className="min-w-0">
        <p className="font-mono text-sm font-medium">{c.code} <span className="text-primary">· {c.percent}% off</span></p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{scope} · {cap} {expiry}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" className="h-3.5 w-3.5 accent-primary" checked={active} disabled={pending} onChange={toggle} />
          Active
        </label>
        <button onClick={remove} disabled={pending} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-red-600" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function DiscountsClient({ initial, products }: { initial: Coupon[]; products: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [scope, setScope] = useState("");
  const [expires, setExpires] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [pending, start] = useTransition();

  const add = () =>
    start(async () => {
      const res = await createCoupon({
        code, percent: Number(percent), product_slug: scope,
        active: true, expires_at: expires, max_uses: maxUses ? Number(maxUses) : null,
      });
      if (res.ok) {
        toast.success("Code created");
        setCode(""); setPercent(""); setScope(""); setExpires(""); setMaxUses("");
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-dashed border-border p-5">
        <p className={labelCls}>New code</p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          <label className="block">
            <span className={labelCls}>Code</span>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME10" className={inputCls + " mt-1 font-mono uppercase"} />
          </label>
          <label className="block">
            <span className={labelCls}>Percent</span>
            <input type="number" min={1} max={90} value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="10" className={inputCls + " mt-1"} />
          </label>
          <label className="block">
            <span className={labelCls}>Applies to</span>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className={inputCls + " mt-1"}>
              <option value="">All products</option>
              {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Ends (optional)</span>
            <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={inputCls + " mt-1"} />
          </label>
          <label className="block">
            <span className={labelCls}>Max uses (blank = ∞)</span>
            <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="20" className={inputCls + " mt-1"} />
          </label>
        </div>
        <button onClick={add} disabled={pending || !code.trim() || !percent} className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-1.5 text-sm text-background disabled:opacity-40">
          <Plus className="h-4 w-4" /> Create code
        </button>
      </div>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">No codes yet.</p>
      ) : (
        <div className="space-y-3">
          {initial.map((c) => <Row key={c.id} c={c} products={products} />)}
        </div>
      )}
    </div>
  );
}
