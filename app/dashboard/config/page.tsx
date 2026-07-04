import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, GitBranch, Terminal, Code } from "lucide-react";
import { EnvVarList, RevealableText } from "./vault-values";
import type {
  EnvironmentSection,
  GitSection,
  VsCodeSection,
} from "@/types/snapshot";

export default async function ConfigPage() {
  const { userId } = await getSession();
  await connectDB();

  const snap = await Snapshot.findOne({ userId })
    .sort({ capturedAt: -1 })
    .lean();

  const environment = snap?.environment as EnvironmentSection | undefined;
  const gitEntries = (snap?.git as GitSection | undefined)?.entries ?? [];
  // PATH-type variables live on the Health page; exclude them here so the
  // count and list agree (and match the snapshot detail stat).
  const envVars = (environment?.user_variables ?? []).filter(
    (v) => !v.name?.toUpperCase().includes("PATH")
  );
  const psProfile = environment?.powershell_profile;
  const extensions = (snap?.vscode as VsCodeSection | undefined)?.extensions ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-amber-400">Config Vault</h1>
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
            {gitEntries.map((entry) => (
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
            {extensions.map((ext) => (
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
            <RevealableText content={psProfile.content ?? ""} />
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
          <EnvVarList
            vars={envVars.map((v) => ({ name: v.name, value: v.value ?? "" }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
