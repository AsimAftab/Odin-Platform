import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Tag, Monitor } from "lucide-react";
import Link from "next/link";
import { SnapshotActions } from "./snapshot-actions";
import type {
  EnvironmentSection,
  GitSection,
  InstalledPackage,
  MachineSection,
  PackagesSection,
  VsCodeSection,
} from "@/types/snapshot";

export default async function SnapshotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await getSession();
  const { id } = await params;
  await connectDB();

  const snap = await Snapshot.findOne({ snapshotId: id, userId }).lean();
  if (!snap) notFound();

  // Other snapshots of the same machine, for the "compare with" picker.
  const siblingDocs = await Snapshot.find({
    machineId: snap.machineId,
    userId,
    snapshotId: { $ne: id },
  })
    .select("snapshotId capturedAt tag")
    .sort({ capturedAt: -1 })
    .limit(50)
    .lean();
  const siblings = siblingDocs.map((s) => ({
    snapshotId: s.snapshotId,
    capturedAt: new Date(s.capturedAt).toISOString(),
    label: `${new Date(s.capturedAt).toLocaleString()}${s.tag ? ` · ${s.tag}` : ""}`,
  }));

  const machine = snap.machine as MachineSection | undefined;
  const packages = (snap.packages as PackagesSection | undefined)?.packages ?? [];
  const extensions = (snap.vscode as VsCodeSection | undefined)?.extensions ?? [];
  const gitEntries = (snap.git as GitSection | undefined)?.entries ?? [];
  // Count matches the Config page: PATH-type variables excluded.
  const envVars = (
    (snap.environment as EnvironmentSection | undefined)?.user_variables ?? []
  ).filter((v) => !v.name.toUpperCase().includes("PATH"));

  const bySource = packages.reduce<Record<string, InstalledPackage[]>>(
    (acc, pkg) => {
      const src = pkg.source ?? "unknown";
      (acc[src] ??= []).push(pkg);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/snapshots" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-mono text-amber-400">{id.slice(0, 8)}…</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Monitor className="w-3 h-3" /> {machine?.hostname}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />{" "}
                {new Date(snap.capturedAt).toLocaleString()}
              </span>
              {snap.tag && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Tag className="w-3 h-3" /> {snap.tag}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <SnapshotActions snapshotId={id} siblings={siblings} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Packages", value: packages.length },
          { label: "Extensions", value: extensions.length },
          { label: "Env Vars", value: envVars.length },
          { label: "Git Config", value: gitEntries.length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="py-3 px-4">
              <p className="text-2xl font-bold text-amber-400">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Packages by source */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(bySource).map(([source, pkgs]) => (
            <div key={source}>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                {source} ({pkgs.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {pkgs.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                    <span className="font-mono text-xs">{pkg.name}</span>
                    <Badge variant="outline" className="text-xs">{pkg.version ?? "—"}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* VS Code Extensions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">VS Code Extensions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {extensions.map((ext) => (
              <div key={ext.identifier} className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                <span className="font-mono text-xs">{ext.identifier}</span>
                <Badge variant="outline" className="text-xs">{ext.version ?? "—"}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Git Config */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Git Config</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {gitEntries.map((entry) => (
              <div key={entry.key} className="flex items-center gap-3 text-sm py-1 border-b border-border/50">
                <span className="font-mono text-xs text-muted-foreground w-40 shrink-0">{entry.key}</span>
                <span className="font-mono text-xs truncate">{entry.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
