import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Machine } from "@/models/Machine";
import { Snapshot } from "@/models/Snapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Clock, Package, Code } from "lucide-react";

export default async function MachinesPage() {
  const { userId } = await auth();
  await connectDB();

  const machines = await Machine.find({ userId }).sort({ lastSeenAt: -1 }).lean();
  const latestSnapshots = await Promise.all(
    machines.map((m) =>
      Snapshot.findOne({ machineId: m._id })
        .sort({ capturedAt: -1 })
        .select("capturedAt packages vscode machine")
        .lean()
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-yellow-400">Machines</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {machines.length} machine{machines.length !== 1 ? "s" : ""} connected to your account
        </p>
      </div>

      {machines.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No machines yet. Run <code className="bg-muted px-1 rounded">odin config push</code> to connect one.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {machines.map((machine, i) => {
          const snap = latestSnapshots[i];
          const pkgCount = (snap?.packages as any)?.packages?.length ?? 0;
          const extCount = (snap?.vscode as any)?.extensions?.length ?? 0;
          const devTools: any[] = (snap?.machine as any)?.developer_tools ?? [];
          const detectedTools = devTools.filter((t) => t.path).map((t) => t.name);

          return (
            <Card key={machine._id.toString()} className="hover:border-yellow-400/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-yellow-400" />
                    <div>
                      <CardTitle className="text-base">{machine.hostname}</CardTitle>
                      <p className="text-xs text-muted-foreground">{machine.username}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{machine.osVersion || "Windows"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="w-3 h-3" />
                    <span>{pkgCount} packages</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Code className="w-3 h-3" />
                    <span>{extCount} extensions</span>
                  </div>
                </div>

                {detectedTools.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {detectedTools.slice(0, 6).map((name) => (
                      <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
                    ))}
                    {detectedTools.length > 6 && (
                      <Badge variant="secondary" className="text-xs">+{detectedTools.length - 6}</Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-2">
                  <Clock className="w-3 h-3" />
                  <span>Last seen {new Date(machine.lastSeenAt).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
