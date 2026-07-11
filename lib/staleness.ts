/**
 * Snapshot-staleness classification for machines. A machine whose last
 * snapshot is old is the tool's core warning sign — a backup you haven't
 * refreshed is a backup you don't have.
 */

export type Staleness = {
  level: "fresh" | "aging" | "stale";
  /** Whole days since the machine last snapshotted. */
  days: number;
  /** Human label, e.g. "today", "3 days ago", "6 weeks ago". */
  label: string;
};

export const AGING_AFTER_DAYS = 14;
export const STALE_AFTER_DAYS = 30;

export function classifyStaleness(lastSeenAt: Date | string, now = new Date()): Staleness {
  const seen = new Date(lastSeenAt).getTime();
  const days = Math.max(0, Math.floor((now.getTime() - seen) / 86_400_000));

  const level = days >= STALE_AFTER_DAYS ? "stale" : days >= AGING_AFTER_DAYS ? "aging" : "fresh";

  let label: string;
  if (days === 0) label = "today";
  else if (days === 1) label = "yesterday";
  else if (days < 14) label = `${days} days ago`;
  else if (days < 60) label = `${Math.floor(days / 7)} weeks ago`;
  else label = `${Math.floor(days / 30)} months ago`;

  return { level, days, label };
}

/** Badge classes per level, matching the dashboard's severity palette. */
export const STALENESS_BADGE: Record<Staleness["level"], string> = {
  fresh: "border-green-400/40 text-green-400",
  aging: "border-amber-400/40 text-amber-400",
  stale: "border-red-400/40 text-red-400",
};
