import { requireAuth } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { diffSnapshots, type SectionDiff } from "@/lib/snapshot-diff";

type Row = { key: string; name: string; version: string };

function SectionCard({
  title,
  diff,
}: {
  title: string;
  diff: SectionDiff<Row>;
}) {
  const total = diff.added.length + diff.removed.length + diff.changed.length;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          {title}{" "}
          <span className="text-muted-foreground font-normal">
            ({total} change{total === 1 ? "" : "s"})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {total === 0 && (
          <p className="text-xs text-muted-foreground py-1">No changes.</p>
        )}
        {diff.added.map((r) => (
          <div key={`a-${r.key}`} className="flex items-center gap-2 text-sm py-1">
            <Plus className="w-3 h-3 text-green-400 shrink-0" />
            <span className="font-mono text-xs">{r.name}</span>
            {r.version && (
              <span className="text-xs text-muted-foreground">{r.version}</span>
            )}
          </div>
        ))}
        {diff.removed.map((r) => (
          <div key={`r-${r.key}`} className="flex items-center gap-2 text-sm py-1">
            <Minus className="w-3 h-3 text-red-400 shrink-0" />
            <span className="font-mono text-xs line-through text-muted-foreground">
              {r.name}
            </span>
          </div>
        ))}
        {diff.changed.map((r) => (
          <div key={`c-${r.key}`} className="flex items-center gap-2 text-sm py-1">
            <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-mono text-xs">{r.name}</span>
            <span className="text-xs text-muted-foreground">
              {r.from || "∅"} → {r.to || "∅"}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default async function SnapshotDiffPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const userId = await requireAuth();
  const { a, b } = await searchParams;
  if (!a || !b) notFound();

  await connectDB();
  const [snapA, snapB] = await Promise.all([
    Snapshot.findOne({ snapshotId: a, userId })
      .select("snapshotId capturedAt packages vscode environment")
      .lean(),
    Snapshot.findOne({ snapshotId: b, userId })
      .select("snapshotId capturedAt packages vscode environment")
      .lean(),
  ]);
  if (!snapA || !snapB) notFound();

  const diff = diffSnapshots(snapA, snapB);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/snapshots/${b}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-amber-400">Compare Snapshots</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {new Date(snapA.capturedAt).toLocaleString()} ({a.slice(0, 8)}) →{" "}
            {new Date(snapB.capturedAt).toLocaleString()} ({b.slice(0, 8)})
          </p>
        </div>
      </div>

      {diff.isEmpty && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            These two snapshots are identical across packages, extensions, and
            environment variables.
          </CardContent>
        </Card>
      )}

      <SectionCard title="Packages" diff={diff.packages} />
      <SectionCard title="VS Code Extensions" diff={diff.extensions} />
      <SectionCard title="Environment Variables" diff={diff.environment} />
    </div>
  );
}
