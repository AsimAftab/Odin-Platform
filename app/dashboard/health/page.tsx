import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default async function HealthPage() {
  const { userId } = await getSession();
  await connectDB();

  const snap = await Snapshot.findOne({ userId })
    .sort({ capturedAt: -1 })
    .lean();

  const machine = snap?.machine as any;
  const environment = snap?.environment as any;
  const devTools: any[] = machine?.developer_tools ?? [];
  const pathEntries: any[] = environment?.path_entries ?? [];

  const brokenPaths = pathEntries.filter((p) => !p.exists);
  const installedTools = devTools.filter((t) => t.path);
  const missingTools = ["Git", "VS Code", "PowerShell"].filter(
    (name) => !devTools.find((t) => t.name === name && t.path)
  );

  const findings = [
    ...brokenPaths.map((p) => ({
      severity: "warning" as const,
      title: "Broken PATH entry",
      detail: p.value,
    })),
    ...missingTools.map((name) => ({
      severity: "error" as const,
      title: `${name} not found`,
      detail: `${name} was not detected on PATH`,
    })),
    ...(brokenPaths.length === 0 && missingTools.length === 0
      ? [{ severity: "info" as const, title: "All checks passed", detail: "No issues detected in latest snapshot" }]
      : []),
  ];

  const severityIcon = {
    error: <AlertTriangle className="w-4 h-4 text-red-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
    info: <CheckCircle className="w-4 h-4 text-green-400" />,
  };

  const severityBadge = {
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    info: "bg-green-500/10 text-green-400 border-green-500/20",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-yellow-400">Health</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Environment diagnostics from the latest snapshot
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-2xl font-bold text-green-400">{installedTools.length}</p>
            <p className="text-xs text-muted-foreground">Tools detected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-2xl font-bold text-yellow-400">{brokenPaths.length}</p>
            <p className="text-xs text-muted-foreground">Broken PATH entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-2xl font-bold text-red-400">{missingTools.length}</p>
            <p className="text-xs text-muted-foreground">Missing tools</p>
          </CardContent>
        </Card>
      </div>

      {/* Findings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartPulse className="w-4 h-4" /> Findings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {findings.map((f, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
              {severityIcon[f.severity]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{f.detail}</p>
              </div>
              <Badge variant="outline" className={`text-xs shrink-0 ${severityBadge[f.severity]}`}>
                {f.severity}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* PATH entries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">PATH Entries ({pathEntries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {pathEntries.map((entry: any, i: number) => (
              <div key={i} className="flex items-center gap-2 py-1 text-xs font-mono border-b border-border/40">
                {entry.exists
                  ? <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                  : <AlertTriangle className="w-3 h-3 text-yellow-400 shrink-0" />}
                <span className={entry.exists ? "" : "text-muted-foreground line-through"}>
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
