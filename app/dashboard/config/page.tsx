import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, GitBranch, Terminal, Code } from "lucide-react";

export default async function ConfigPage() {
  const { userId } = await getSession();
  await connectDB();

  const snap = await Snapshot.findOne({ userId })
    .sort({ capturedAt: -1 })
    .lean();

  const gitEntries: any[] = (snap?.git as any)?.entries ?? [];
  const envVars: any[] = (snap?.environment as any)?.user_variables ?? [];
  const psProfile = (snap?.environment as any)?.powershell_profile;
  const extensions: any[] = (snap?.vscode as any)?.extensions ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-yellow-400">Config Vault</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Stored configuration from your latest snapshot
        </p>
      </div>

      {/* Git config */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4" /> Git Config ({gitEntries.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {gitEntries.map((entry: any) => (
              <div key={entry.key} className="flex items-center gap-3 py-1.5 border-b border-border/40 text-sm">
                <span className="font-mono text-xs text-muted-foreground w-48 shrink-0">{entry.key}</span>
                <span className="font-mono text-xs truncate">{entry.value}</span>
              </div>
            ))}
            {gitEntries.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No git config entries found.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* VS Code extensions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="w-4 h-4" /> VS Code Extensions ({extensions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {extensions.map((ext: any) => (
              <div key={ext.identifier} className="flex items-center justify-between py-1.5 border-b border-border/40 text-sm">
                <span className="font-mono text-xs truncate max-w-[70%]">{ext.identifier}</span>
                <Badge variant="outline" className="text-xs font-mono">{ext.version ?? "—"}</Badge>
              </div>
            ))}
            {extensions.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No VS Code extensions found.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PowerShell profile */}
      {psProfile && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4" /> PowerShell Profile
            </CardTitle>
            <p className="text-xs text-muted-foreground font-mono">{psProfile.path}</p>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono bg-muted rounded-md p-3 overflow-x-auto max-h-64 whitespace-pre-wrap">
              {psProfile.content || "(empty profile)"}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* User env vars */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" /> User Environment Variables ({envVars.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {envVars
              .filter((v: any) => !v.name.toUpperCase().includes("PATH"))
              .map((v: any) => (
                <div key={v.name} className="flex items-center gap-3 py-1.5 border-b border-border/40 text-sm">
                  <span className="font-mono text-xs text-muted-foreground w-40 shrink-0">{v.name}</span>
                  <span className="font-mono text-xs truncate text-foreground/70">{v.value}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
