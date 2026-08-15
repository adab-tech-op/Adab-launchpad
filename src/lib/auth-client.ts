"use client";

import { createAuthClient } from "better-auth/react";

// IMPORTANT: no baseURL here. In the browser Better Auth defaults to the CURRENT
// origin, so auth requests are always same-origin — whether the visitor is on
// apex (adab.world) or www (www.adab.world). Setting baseURL to a fixed origin
// (e.g. the apex) makes a www visitor POST cross-origin, hit the apex→www
// redirect, and get blocked by CORS — which manifests as a sign-in that spins
// forever. Same-origin avoids that entirely.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession, requestPasswordReset, resetPassword } = authClient;
