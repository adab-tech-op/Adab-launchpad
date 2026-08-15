import { requireRootPage, getRoster, getPendingInvites } from "@/lib/roles";
import { TeamClient } from "./team-client";

export const metadata = { title: "Team — ADAB Studio" };

export default async function TeamPage() {
  const actor = await requireRootPage();
  const [roster, invites] = await Promise.all([getRoster(), getPendingInvites()]);

  return (
    <div>
      <h1 className="font-editorial text-4xl">Team.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Who can access the studio, what they can do, and who&rsquo;s online. Only root admins see this.
      </p>
      <div className="mt-8">
        <TeamClient roster={roster} invites={invites} selfEmail={actor.email} />
      </div>
    </div>
  );
}
