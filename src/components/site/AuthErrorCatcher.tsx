"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function AuthErrorCatcher() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const error = params.get("error");
    if (error) router.replace(`/welcome?error=${encodeURIComponent(error)}`);
  }, [params, router]);
  return null;
}
