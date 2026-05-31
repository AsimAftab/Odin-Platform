import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { Machine } from "@/models/Machine";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Clock, Tag } from "lucide-react";

export default async function SnapshotsPage() {
  const { userId } = await auth();
  await connectDB();

  const snapshots = await Snapshot.find({ userId })
    .select("snapshotId machineId capturedAt tag createdAt")
    .sort({ capturedAt: -1 })
    .limit(100)
    .lean();

  const machines = await Machine.find({ userId }).lean();
  const machineMap = Object.fromEntries(
    machines.map((m) => [m._id.toString(), m.hostname])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-yellow-400">Snapshots</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""} across all machines
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
            <Card className="hover:border-yellow-400/40 transition-colors cursor-pointer">
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
    </div>
  );
}
