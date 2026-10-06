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

type ProductRef = { slug: string; name: string; price: string };

/** "৳ 4,500" to 4500, so a percentage can be shown as a price. */
function priceToNumber(price: string): number | null {
  const n = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const taka = (n: number) => `৳ ${Math.round(n).toLocaleString()}`;

/**
 * What the code will actually do, in the prices it produces.
 *
 * A percentage in a box is not a price, and the thing worth being certain of
 * before creating a code is what the customer ends up paying.
 */
function effectSentence(
  code: string,
  percent: number,
  scope: string,
  products: ProductRef[],
  maxUses: string,
  expires: string,
): string | null {
  if (!code.trim() || !percent) return null;

  const affected = scope ? products.filter((p) => p.slug === scope) : products;
  const prices = affected
    .map((p) => ({ name: p.name, from: priceToNumber(p.price) }))
    .filter((p): p is { name: string; from: number } => p.from !== null)
    .slice(0, 2)
    .map((p) => `${p.name} becomes ${taka(p.from * (1 - percent / 100))}`);

  const what = scope
    ? `takes ${percent}% off the ${affected[0]?.name ?? "selected piece"}`
    : `takes ${percent}% off any piece`;

  const limits = [
    maxUses ? `${maxUses} uses in total` : "unlimited uses",
    "one per email address",
    expires ? `ends ${expires}` : "no end date",
  ].join(", ");

  return `A customer typing ${code.trim().toUpperCase()} ${what}. ${prices.join(". ")}${prices.length ? "." : ""} ${limits[0].toUpperCase()}${limits.slice(1)}.`;
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "text-[11px] uppercase tracking-[0.06em] text-muted-foreground";

function Row({ c, products }: { c: Coupon; products: ProductRef[] }) {
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
  // "4/20 used" did not say whether the code still worked. A code can be out
  // of uses or past its date while still showing as active.
  const usedUp = c.max_uses != null && c.committed_uses >= c.max_uses;
  const expired = !!c.expires_at && new Date(c.expires_at).getTime() < Date.now();
  const cap = usedUp
    ? `All ${c.max_uses} uses taken`
    : c.max_uses != null
      ? `${c.committed_uses} of ${c.max_uses} used`
      : `${c.committed_uses} used, no limit`;
  const expiry = c.expires_at
    ? expired
      ? `· expired ${String(c.expires_at).slice(0, 10)}`
      : `· ends ${String(c.expires_at).slice(0, 10)}`
    : "· no end date";
  const spent = usedUp || expired;

  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-4">
      <div className="min-w-0">
        <p className="font-mono text-sm font-medium">{c.code} <span className="text-primary">· {c.percent}% off</span></p>
        <p className={`mt-0.5 truncate text-xs ${spent ? "text-destructive" : "text-muted-foreground"}`}>
          {scope} · {cap} {expiry}
          {spent && active ? " · cannot be redeemed" : ""}
        </p>
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

export function DiscountsClient({ initial, products }: { initial: Coupon[]; products: ProductRef[] }) {
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
        {effectSentence(code, Number(percent), scope, products, maxUses, expires) && (
          <p className="mt-4 rounded-xl bg-primary p-3.5 text-[12.5px] leading-relaxed text-primary-foreground">
            {effectSentence(code, Number(percent), scope, products, maxUses, expires)}
          </p>
        )}
        <button onClick={add} disabled={pending || !code.trim() || !percent} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-40">
          <Plus className="h-4 w-4" /> Create code
        </button>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Codes are private. Nothing on the site changes until a customer types one at checkout.
        </p>
      </div>

      {initial.length === 0 ? (
        <div className="paper-grain rounded-2xl border border-border p-10 text-center">
          <p className="font-editorial text-2xl italic text-muted-foreground">No codes yet.</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
            A code discounts nothing until a customer enters it. A use commits when they submit payment and frees again
            if the order is cancelled, so the count can go down as well as up.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {initial.map((c) => <Row key={c.id} c={c} products={products} />)}
        </div>
      )}
    </div>
  );
}
