"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/queries";

const SIZES = ["", "S", "M", "L", "XL", "XXL"];
const input =
  "w-full rounded-md border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition-colors";
const label = "font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground";

export function ProfileForm({ initial, name, email }: { initial: Profile; name: string; email: string }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Profile, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await saveProfile(form);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Profile saved.");
  };

  return (
    <form onSubmit={submit} className="mt-10 space-y-6">
      <div className="rounded-2xl border border-border p-6 paper-grain">
        <p className={label}>Account</p>
        <p className="mt-2 text-sm">{name}</p>
        <p className="text-sm text-muted-foreground break-all">{email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className={label}>Phone (WhatsApp/bKash)</span>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={input + " mt-2"} placeholder="+8801…" />
        </label>
        <label className="block">
          <span className={label}>Default size</span>
          <select value={form.default_size} onChange={(e) => set("default_size", e.target.value)} className={input + " mt-2"}>
            {SIZES.map((s) => (
              <option key={s} value={s}>{s === "" ? "—" : s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className={label}>Address</span>
          <input value={form.address_line} onChange={(e) => set("address_line", e.target.value)} className={input + " mt-2"} placeholder="House, road, area" />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block">
            <span className={label}>Area / Thana</span>
            <input value={form.area} onChange={(e) => set("area", e.target.value)} className={input + " mt-2"} />
          </label>
          <label className="block">
            <span className={label}>City</span>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} className={input + " mt-2"} />
          </label>
          <label className="block">
            <span className={label}>Postal code</span>
            <input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} className={input + " mt-2"} />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-foreground px-8 py-3.5 text-xs uppercase tracking-[0.2em] text-background hover:bg-foreground/85 transition-colors disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
