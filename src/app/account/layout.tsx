import { requireUser } from "@/lib/auth-guard";
import { AccountSidebar } from "@/components/site/AccountSidebar";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8 py-16 md:py-24">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr] lg:gap-16">
        <AccountSidebar name={user.name} email={user.email} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
