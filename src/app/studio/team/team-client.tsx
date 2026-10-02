"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, MoreHorizontal } from "lucide-react";
import { inviteAdmin, revokeInvite, resendInvite, changeRole, removeMember } from "@/lib/actions/team";
import type { RosterMember, PendingInvite, Role } from "@/lib/roles";

const ROLE_OPTIONS: Role[] = ["moderator", "admin", "root"];
const ROLE_LABEL: Record<Role, string> = { root: "Root admin", admin: "Admin", moderator: "Moderator" };

/** Naming a role without saying what it grants is the most common failure in
 *  this kind of screen: "Moderator" does not tell anyone it is read-only. */
const ROLE_SUMMARY: Record<Role, string> = {
  moderator: "can view Studio",
  admin: "can change everything",
  root: "can also manage the team",
};
const ROLE_DETAIL: Record<Role, string> = {
  moderator:
    "A moderator sees Studio read only. Orders, inbox, content, all visible. They cannot change, delete or publish anything.",
  admin:
    "An admin can change everything in Studio: products, orders, content, discounts. They cannot invite, remove or re-role anyone.",
  root: "A root admin can do everything an admin can, and also manage who has access to Studio.",
};

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

function untilExpiry(ts: string): string {
  const diff = new Date(ts).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "expires within the hour";
  if (h < 48) return `expires in ${h} hours`;
  return `expires in ${Math.floor(h / 24)} days`;
}

function onDate(ts: string | null): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** One list, members and invitations together, so "who can reach Studio?" is
 *  answered in one place rather than by reading two sections and inferring. */
type Row =
  | { kind: "member"; email: string; role: Role; fromEnv: boolean; lastSeen: string | null; online: boolean }
  | { kind: "invite"; invite: PendingInvite };

export function TeamClient({
  roster,
  invites,
  currentEmail,
  siteUrl,
}: {
  roster: RosterMember[];
  invites: PendingInvite[];
  currentEmail: string;
  siteUrl: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  // Least privilege by default; granting more should be a deliberate act.
  const [role, setRole] = useState<Role>("moderator");
  const [pending, start] = useTransition();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const rootCount = useMemo(() => roster.filter((m) => m.role === "root").length, [roster]);

  const rows: Row[] = useMemo(
    () => [
      ...roster.map((m) => ({ kind: "member" as const, ...m })),
      ...invites.map((invite) => ({ kind: "invite" as const, invite })),
    ],
    [roster, invites],
  );

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, okMsg: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(okMsg);
        setOpenMenu(null);
        router.refresh();
      } else toast.error(res.error);
    });

  const invite = () =>
    run(async () => {
      const res = await inviteAdmin({ email, role });
      if (res.ok) setEmail("");
      return res;
    }, "Invitation sent");

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(`${siteUrl}/invite/accept?token=${token}`);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy. Check clipboard permissions.");
    }
    setOpenMenu(null);
  };

  const inputCls =
    "w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-10">
      {/* Invite */}
      <section className="rounded-2xl border border-border bg-primary p-5 text-primary-foreground md:p-6">
        <p className="text-sm">Invite someone</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_250px_auto]">
          <div>
            <input
              className={inputCls}
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-primary-foreground/70">
              The invitation is locked to this address. Nobody else can redeem it.
            </p>
          </div>
          <div>
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}, {ROLE_SUMMARY[r]}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] leading-relaxed text-primary-foreground/70">Starts at the least access.</p>
          </div>
          <button
            onClick={invite}
            disabled={pending || !email.trim()}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-full bg-[#FFCD5C] px-6 text-sm text-foreground disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" strokeWidth={1.5} />
            Send invitation
          </button>
        </div>
        <p className="mt-4 rounded-xl bg-background/95 p-3.5 text-xs leading-relaxed text-foreground">
          {ROLE_DETAIL[role]}
        </p>
      </section>

      {/* Directory */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-editorial text-2xl">Everyone with access.</h2>
          <span className="text-xs text-muted-foreground">
            {roster.length} active, {invites.length} invited
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden grid-cols-[1fr_200px_140px_110px_40px] gap-4 bg-primary px-5 py-3 text-xs text-primary-foreground/80 lg:grid">
            <span>Person</span>
            <span>Status</span>
            <span>Role</span>
            <span>Last seen</span>
            <span />
          </div>

          {rows.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">Nobody yet.</p>
          ) : (
            rows.map((row) => {
              if (row.kind === "invite") {
                const inv = row.invite;
                const key = `invite:${inv.id}`;
                return (
                  <div
                    key={key}
                    className="grid grid-cols-1 items-center gap-2 border-t border-border px-5 py-4 lg:grid-cols-[1fr_200px_140px_110px_40px] lg:gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                        <span className="truncate text-sm">{inv.email}</span>
                      </div>
                      <p className="mt-1 pl-4 text-[11px] text-muted-foreground">
                        Invited {relative(inv.createdAt)} by {inv.invitedBy}
                      </p>
                    </div>
                    <span className={`text-xs ${inv.expired ? "text-destructive" : ""}`}>
                      {inv.expired ? "Invitation expired" : `Invited, ${untilExpiry(inv.expiresAt)}`}
                    </span>
                    <span className="text-xs">{ROLE_LABEL[inv.role]}</span>
                    <span className="text-xs text-muted-foreground">never</span>
                    <RowMenu
                      open={openMenu === key}
                      onToggle={() => setOpenMenu(openMenu === key ? null : key)}
                      items={[
                        { label: "Resend invitation", onClick: () => run(() => resendInvite(inv.id), "Invitation resent") },
                        { label: "Copy invite link", onClick: () => copyLink(inv.token) },
                        {
                          label: "Revoke invitation",
                          danger: true,
                          onClick: () => run(() => revokeInvite(inv.id), "Invitation revoked"),
                        },
                      ]}
                    />
                  </div>
                );
              }

              const isSelf = row.email.toLowerCase() === currentEmail.toLowerCase();
              const lastRoot = row.role === "root" && rootCount <= 1;
              // Surfaced in the UI, not only as an error after the click: the
              // server already refuses these, but a disabled control explains
              // why before you try.
              const lockReason = isSelf
                ? "You cannot change your own access."
                : lastRoot
                  ? "Promote someone else to root first, or nobody could manage the team."
                  : null;
              const key = `member:${row.email}`;

              return (
                <div
                  key={key}
                  className="grid grid-cols-1 items-center gap-2 border-t border-border px-5 py-4 lg:grid-cols-[1fr_200px_140px_110px_40px] lg:gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.online ? "bg-emerald-600" : "bg-border"}`}
                      />
                      <span className="truncate text-sm">{row.email}</span>
                      {isSelf && <span className="shrink-0 text-[11px] text-muted-foreground">(you)</span>}
                    </div>
                    <p className="mt-1 pl-4 text-[11px] text-muted-foreground">
                      {row.fromEnv ? "Owner account, set in the environment" : `Joined ${onDate(row.lastSeen) || "recently"}`}
                    </p>
                  </div>
                  <span className="text-xs">Active</span>
                  <div>
                    {lockReason ? (
                      <span className="text-xs" title={lockReason}>
                        {ROLE_LABEL[row.role]}
                      </span>
                    ) : (
                      <select
                        value={row.role}
                        disabled={pending}
                        onChange={(e) => run(() => changeRole(row.email, e.target.value), "Role updated")}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{relative(row.lastSeen)}</span>
                  <RowMenu
                    open={openMenu === key}
                    onToggle={() => setOpenMenu(openMenu === key ? null : key)}
                    items={[
                      {
                        label: "Remove access",
                        danger: true,
                        disabled: !!lockReason,
                        hint: lockReason ?? undefined,
                        onClick: () => run(() => removeMember(row.email), "Member removed"),
                      },
                    ]}
                  />
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function RowMenu({
  open,
  onToggle,
  items,
}: {
  open: boolean;
  onToggle: () => void;
  items: { label: string; onClick: () => void; danger?: boolean; disabled?: boolean; hint?: string }[];
}) {
  return (
    <div className="relative justify-self-start lg:justify-self-center">
      <button
        onClick={onToggle}
        aria-label="Row actions"
        aria-expanded={open}
        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={it.onClick}
              disabled={it.disabled}
              title={it.hint}
              className={`block w-full px-4 py-2.5 text-left text-sm disabled:opacity-40 ${
                it.danger ? "text-destructive" : ""
              } hover:bg-muted/60`}
            >
              {it.label}
              {it.disabled && it.hint && (
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{it.hint}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
