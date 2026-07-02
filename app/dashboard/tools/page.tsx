import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package } from "lucide-react";

const SOURCE_COLORS: Record<string, string> = {
  winget: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  chocolatey: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  scoop: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  npm: "bg-red-500/10 text-red-400 border-red-500/20",
  pip: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  cargo: "bg-orange-600/10 text-orange-300 border-orange-600/20",
  manual: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  unknown: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default async function ToolsPage() {
  const { userId } = await getSession();
  await connectDB();

  const snap = await Snapshot.findOne({ userId })
    .sort({ capturedAt: -1 })
    .lean();

  const packages: any[] = (snap?.packages as any)?.packages ?? [];
  const devTools: any[] = (snap?.machine as any)?.developer_tools ?? [];

  const bySource = packages.reduce((acc: Record<string, any[]>, pkg) => {
    const src = pkg.source ?? "unknown";
    if (!acc[src]) acc[src] = [];
    acc[src].push(pkg);
    return acc;
  }, {});

  const sourceCounts = Object.entries(bySource).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-yellow-400">Dev Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {packages.length} packages across {Object.keys(bySource).length} package managers
        </p>
      </div>

      {/* Dev tools detected */}
      {devTools.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Detected Runtimes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {devTools.map((tool) => (
                <div key={tool.name} className="flex items-center gap-2 border border-border rounded-md px-3 py-1.5 text-sm">
                  <span className="font-medium">{tool.name}</span>
                  {tool.version && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {tool.version.split("\n")[0].trim()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source summary */}
      <div className="flex flex-wrap gap-2">
        {sourceCounts.map(([source, pkgs]) => (
          <Badge key={source} variant="outline" className={SOURCE_COLORS[source] ?? ""}>
            {source} · {pkgs.length}
          </Badge>
        ))}
      </div>

      {/* Packages by source */}
      {sourceCounts.map(([source, pkgs]) => (
        <Card key={source}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="capitalize">{source}</span>
              <Badge variant="outline" className="text-xs ml-auto">{pkgs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1">
              {pkgs.map((pkg: any) => (
                <div key={pkg.id} className="flex items-center justify-between py-1.5 border-b border-border/40 text-sm">
                  <span className="font-mono text-xs truncate max-w-[60%]">{pkg.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs font-mono">{pkg.version ?? "—"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {packages.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No packages found. Run <code className="bg-muted px-1 rounded">odin snapshot</code> to capture your environment.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
