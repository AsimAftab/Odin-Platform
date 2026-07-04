import { Snapshot } from "@/models/Snapshot";
import type { Types } from "mongoose";

export interface LatestSnapshotSummary {
  capturedAt: Date | null;
  pkgCount: number;
  extCount: number;
  developerTools: { name: string; path?: string }[];
}

/**
 * Latest-snapshot summary per machine for a user, in ONE aggregation instead of
 * a findOne-per-machine loop (the old N+1). Counts are computed inside Mongo via
 * `$size`, and only small fields are returned — the large Mixed payloads
 * (packages list, extensions, env) never leave the database.
 *
 * Backed by the `{ userId, machineId, capturedAt }` index on Snapshot.
 * Returns a Map keyed by `machineId.toString()`.
 */
export async function latestSnapshotSummaries(
  userId: string
): Promise<Map<string, LatestSnapshotSummary>> {
  const rows = await Snapshot.aggregate<{
    _id: Types.ObjectId;
    capturedAt: Date;
    pkgCount: number;
    extCount: number;
    developerTools: { name: string; path?: string }[] | null;
  }>([
    { $match: { userId } },
    { $sort: { capturedAt: -1 } },
    {
      $group: {
        _id: "$machineId",
        capturedAt: { $first: "$capturedAt" },
        pkgCount: {
          $first: { $size: { $ifNull: ["$packages.packages", []] } },
        },
        extCount: {
          $first: { $size: { $ifNull: ["$vscode.extensions", []] } },
        },
        developerTools: { $first: "$machine.developer_tools" },
      },
    },
  ]);

  const map = new Map<string, LatestSnapshotSummary>();
  for (const r of rows) {
    map.set(r._id.toString(), {
      capturedAt: r.capturedAt ?? null,
      pkgCount: r.pkgCount ?? 0,
      extCount: r.extCount ?? 0,
      developerTools: Array.isArray(r.developerTools) ? r.developerTools : [],
    });
  }
  return map;
}
