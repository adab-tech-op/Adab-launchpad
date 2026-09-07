import { redirect } from "next/navigation";

// The Latest page became The Drop. Keep the old URL working.
export default function LatestRedirect() {
  redirect("/drop");
}
