import { requireAuth } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Machine } from "@/models/Machine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Package, Clock, Puzzle } from "lucide-react";
import { latestSnapshotSummaries } from "@/lib/snapshot-queries";

export default async function DashboardPage() {
  const userId = await requireAuth();
  await connectDB();

  const machines = await Machine.find({ userId }).sort({ lastSeenAt: -1 }).lean();
  const summaries = await latestSnapshotSummaries(userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-amber-400">ᚢ Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {machines.length} machine{machines.length !== 1 ? "s" : ""} connected
        </p>
      </div>

      {machines.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No machines connected yet</p>
            <p className="text-sm">
              Run <code className="bg-muted px-1 rounded">odin login</code> on your machine,
              then <code className="bg-muted px-1 rounded">odin sync</code> to send your
              first snapshot.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {machines.map((machine) => {
          const summary = summaries.get(machine._id.toString());
          const pkgCount = summary?.pkgCount ?? 0;
          const extCount = summary?.extCount ?? 0;
          const capturedAt = summary?.capturedAt
            ? new Date(summary.capturedAt).toLocaleString()
            : "No snapshot yet";

          return (
            <Card key={machine._id.toString()} className="hover:border-amber-400/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-amber-400" />
                    {machine.hostname}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {machine.osVersion || "Windows"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{machine.username}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="w-3 h-3" />
                    <span>{pkgCount} packages</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Puzzle className="w-3 h-3" />
                    <span>{extCount} extensions</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-2">
                  <Clock className="w-3 h-3" />
                  <span>{capturedAt}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
