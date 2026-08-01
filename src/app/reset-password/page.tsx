import { Suspense } from "react";
import { ResetClient } from "./reset-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <ResetClient />
    </Suspense>
  );
}
