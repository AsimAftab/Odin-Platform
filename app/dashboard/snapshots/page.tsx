import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { Machine } from "@/models/Machine";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Clock, Tag, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

export default async function SnapshotsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId } = await getSession();
  await connectDB();

  const { page: pageParam } = await searchParams;
  const page = Math.max(parseInt(pageParam ?? "1") || 1, 1);

  const total = await Snapshot.countDocuments({ userId });
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const snapshots = await Snapshot.find({ userId })
    .select("snapshotId machineId capturedAt tag createdAt")
    .sort({ capturedAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  const machines = await Machine.find({ userId }).lean();
  const machineMap = Object.fromEntries(
    machines.map((m) => [m._id.toString(), m.hostname])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-amber-400">Snapshots</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {total} snapshot{total !== 1 ? "s" : ""} across all machines
        </p>
      </div>

      {snapshots.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No snapshots yet. Run <code className="bg-muted px-1 rounded">odin snapshot</code> to capture your first one.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {snapshots.map((snap) => (
          <Link key={snap.snapshotId} href={`/dashboard/snapshots/${snap.snapshotId}`}>
            <Card className="hover:border-amber-400/40 transition-colors cursor-pointer">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium font-mono">
                      {snap.snapshotId.slice(0, 8)}…
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {machineMap[snap.machineId?.toString()] ?? "unknown"} ·{" "}
                      {new Date(snap.capturedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {snap.tag && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Tag className="w-3 h-3" />
                      {snap.tag}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={`/dashboard/snapshots?page=${page - 1}`}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:border-amber-400/40"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-border/40 px-2.5 py-1 text-xs text-muted-foreground/50">
                <ChevronLeft className="w-3 h-3" /> Prev
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={`/dashboard/snapshots?page=${page + 1}`}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:border-amber-400/40"
              >
                Next <ChevronRight className="w-3 h-3" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-border/40 px-2.5 py-1 text-xs text-muted-foreground/50">
                Next <ChevronRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
