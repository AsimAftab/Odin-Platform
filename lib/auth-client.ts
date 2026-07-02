"use client";

import { createAuthClient } from "better-auth/react";

// baseURL is inferred from the current origin in the browser, so this works on
// localhost, *.vercel.app, and any custom domain without configuration.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
