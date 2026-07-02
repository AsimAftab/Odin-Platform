import { getSession } from "@/lib/session";

/** Maintainer allowlist from env (comma-separated emails), case-insensitive. */
export function getMaintainerEmails(): string[] {
  return (process.env.MAINTAINER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** True if the current session belongs to a configured maintainer. */
export async function isMaintainer(): Promise<boolean> {
  const { user } = await getSession();
  const email = user?.email?.toLowerCase();
  if (!email) return false;
  return getMaintainerEmails().includes(email);
}
