import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Drop-in replacement for Clerk's `auth()`. Returns the current user's id (or
 * null) from the Better Auth session cookie. Call sites use:
 *   const { userId } = await getSession();
 */
export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return {
    userId: session?.user?.id ?? null,
    user: session?.user ?? null,
  };
}

/** Throws if there is no authenticated user; otherwise returns the userId. */
export async function requireAuth() {
  const { userId } = await getSession();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
