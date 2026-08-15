import { getNotifyList } from "@/lib/studio";
import { ExportButton } from "./export-button";

export const metadata = { title: "Notify list — ADAB Studio" };

export default async function NotifyPage() {
  const contacts = await getNotifyList();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-4xl">Notify list.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everyone who opted in — newsletter signups and buyers who ticked consent at checkout. Use this for drop announcements.
          </p>
        </div>
        <ExportButton contacts={contacts} />
      </div>

      <p className="mt-6 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {contacts.length} contact{contacts.length === 1 ? "" : "s"}
      </p>

      {contacts.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border p-12 text-center paper-grain">
          <p className="font-editorial text-2xl italic text-muted-foreground">No opted-in contacts yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="px-4 py-3 font-normal">Source</th>
                <th className="px-4 py-3 font-normal">Added</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.email} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 break-all">{c.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.source}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {new Date(c.addedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
        Broadcast emails to this list must include an unsubscribe link. Transactional order emails do not use this list.
      </p>
    </div>
  );
}
