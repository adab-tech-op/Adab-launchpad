import { requireAdmin } from "@/lib/admin";
import { StudioSidebar } from "@/components/site/StudioSidebar";

export const metadata = { title: "ADAB Studio" };

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // redirects non-admins
  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-24">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr] lg:gap-16">
        <StudioSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
