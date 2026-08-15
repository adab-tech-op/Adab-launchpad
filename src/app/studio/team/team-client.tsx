"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import { inviteAdmin, revokeInvite, changeRole, removeMember } from "@/lib/actions/team";
import type { RosterMember, PendingInvite, Role } from "@/lib/roles";

const ROLE_OPTIONS: Role[] = ["moderator", "admin", "root"];
const ROLE_LABEL: Record<Role, string> = { root: "Root admin", admin: "Admin", moderator: "Moderator" };

function relative(ts: string | null): string {
  if (!ts) return "never";
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function TeamClient({
  roster,
  invites,
  selfEmail,
}: {
  roster: RosterMember[];
  invites: PendingInvite[];
  selfEmail: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) =>
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        toast.error(res.error ?? "Something went wrong.");
        return;
      }
      toast.success(okMsg);
      router.refresh();
    });

  const invite = () => {
    if (!email.trim()) return;
    run(() => inviteAdmin({ email: email.trim(), role }), "Invitation sent");
    setEmail("");
  };

  return (
    <div className="space-y-12">
      {/* Invite */}
      <div className="rounded-2xl border border-border p-6">
        <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          <UserPlus className="h-3.5 w-3.5" strokeWidth={1.75} /> Invite someone
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={invite}
            disabled={pending || !email.trim()}
            className="rounded-full bg-foreground px-5 py-2 text-xs uppercase tracking-[0.16em] text-background disabled:opacity-40"
          >
            Send invite
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          They&rsquo;ll get an email to accept. The invite expires in 72 hours and can be used once.
        </p>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div>
          <h2 className="font-editorial text-2xl">Pending invitations.</h2>
          <div className="mt-4 space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm">
                <div className="min-w-0">
                  <span className="break-all">{inv.email}</span>
                  <span className="ml-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">{ROLE_LABEL[inv.role]}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>expires {relative(inv.expiresAt).replace(" ago", "")}</span>
                  <button
                    type="button"
                    onClick={() => run(() => revokeInvite(inv.id), "Invitation revoked")}
                    disabled={pending}
                    className="inline-flex items-center gap-1 hover:text-destructive disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" /> Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roster */}
      <div>
        <h2 className="font-editorial text-2xl">Members.</h2>
        <div className="mt-4 space-y-2">
          {roster.map((m) => {
            const isSelf = m.email === selfEmail.toLowerCase();
            return (
              <div key={m.email} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${m.online ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                    title={m.online ? "online" : `last seen ${relative(m.lastSeen)}`}
                  />
                  <span className="break-all">{m.email}</span>
                  {isSelf && <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">you</span>}
                  {m.fromEnv && <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-muted-foreground" title="Role from env allowlist; not yet a saved member">env</span>}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{m.online ? "online" : relative(m.lastSeen)}</span>
                  <select
                    value={m.role}
                    disabled={pending || isSelf}
                    onChange={(e) => run(() => changeRole(m.email, e.target.value), `${m.email} → ${e.target.value}`)}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] outline-none focus:border-primary disabled:opacity-60"
                    title={isSelf ? "You can't change your own role" : undefined}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                    ))}
                  </select>
                  {!isSelf && !m.fromEnv && (
                    <button
                      type="button"
                      onClick={() => run(() => removeMember(m.email), "Member removed")}
                      disabled={pending}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                      aria-label={`Remove ${m.email}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          A green dot means active in the last 5 minutes. &ldquo;env&rdquo; members come from the ADMIN_EMAILS allowlist — assign them a role here to manage them fully.
        </p>
      </div>
    </div>
  );
}
