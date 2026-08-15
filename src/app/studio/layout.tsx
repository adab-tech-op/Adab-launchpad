import { StudioSidebar } from "@/components/site/StudioSidebar";
import { requireStudioAccess } from "@/lib/roles";

export const metadata = { title: "ADAB Studio" };

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireStudioAccess(); // redirects non-admins; allows moderators to view
  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-24">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr] lg:gap-16">
        <StudioSidebar role={actor.role} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
