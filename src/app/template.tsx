// A template re-mounts on every navigation (unlike layout), so the wrapper's
// entrance animation replays on each route change — a gentle content cross-fade.
// The persistent chrome (header/footer) lives in layout/providers and stays put.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
