import { getWaitlist, getContactMessages } from "@/lib/studio";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function StudioInbox() {
  const [waitlist, messages] = await Promise.all([getWaitlist(), getContactMessages()]);
  return (
    <div className="space-y-14">
      <div>
        <h1 className="font-editorial text-4xl">Messages.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{messages.length} contact message{messages.length === 1 ? "" : "s"}.</p>
        {messages.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          <div className="mt-8 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className="rounded-2xl border border-border p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-sans">{m.name} <span className="text-xs text-muted-foreground break-all">· {m.email}</span></p>
                  <p className="text-xs text-muted-foreground">{fmt(m.created_at)}</p>
                </div>
                {m.order_number && <p className="mt-1 text-xs text-muted-foreground">Order: {m.order_number}</p>}
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{m.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-editorial text-3xl">Waitlist.</h2>
        <p className="mt-2 text-sm text-muted-foreground">{waitlist.length} signup{waitlist.length === 1 ? "" : "s"}.</p>
        {waitlist.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">No signups yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr className="border-b border-border text-left">
                  <th className="py-2 font-normal">Email</th>
                  <th className="py-2 font-normal">Phone</th>
                  <th className="py-2 font-normal">Source</th>
                  <th className="py-2 font-normal text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((w, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="py-2.5 break-all">{w.email}</td>
                    <td className="py-2.5 text-muted-foreground">{w.phone ?? "—"}</td>
                    <td className="py-2.5 text-muted-foreground">{w.source ?? "—"}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{fmt(w.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
