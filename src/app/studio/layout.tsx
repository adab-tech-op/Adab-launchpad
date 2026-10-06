import { StudioSidebar } from "@/components/site/StudioSidebar";
import { requireStudioAccess } from "@/lib/roles";

export const metadata = { title: "ADAB Studio" };

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireStudioAccess(); // redirects non-admins; allows moderators to view

  return (
    // Two panels floating on the page with the same gutter on every side,
    // rather than a sidebar and a column of bare text. The page background
    // shows through between and around them, which is what makes each read as
    // its own surface.
    <div data-studio className="min-h-dvh bg-background p-4 md:p-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 md:gap-5 lg:flex-row">
        <StudioSidebar role={actor.role} />

        {/* Fills the remaining width, and at least the remaining height, so a
            short page still reads as a panel rather than a card that stops
            halfway down. */}
        <main className="min-w-0 flex-1 rounded-3xl bg-card p-6 md:p-9 lg:min-h-[calc(100dvh-2.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
