import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { CatalogTool } from "@/models/CatalogTool";
import { ToolRequest } from "@/models/ToolRequest";
import { ensureCatalogSeeded } from "@/lib/ensure-catalog";
import { slugify } from "@/lib/catalog-util";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookMarked, Check, Package } from "lucide-react";
import { SOURCE_COLORS, STATUS_COLORS } from "@/lib/status-colors";
import { RequestToolButton } from "./request-tool-button";
import type {
  DeveloperTool,
  InstalledPackage,
  MachineSection,
  PackagesSection,
} from "@/types/snapshot";

interface CatalogKeyDoc {
  slug: string;
  name: string;
  install?: { packageId?: string }[];
}

interface RequestDoc {
  name: string;
  status: string;
  correctionNote?: string;
  createdAt?: Date;
}

/** All lowercase keys a catalog tool can be matched by. */
function catalogKeys(tools: CatalogKeyDoc[]): Set<string> {
  const keys = new Set<string>();
  for (const t of tools) {
    keys.add(t.slug.toLowerCase());
    keys.add(t.name.toLowerCase());
    for (const i of t.install ?? []) {
      if (i.packageId) keys.add(i.packageId.toLowerCase());
    }
  }
  return keys;
}

function inCatalog(keys: Set<string>, pkg: InstalledPackage): boolean {
  return (
    keys.has(pkg.id.toLowerCase()) ||
    keys.has(pkg.name.toLowerCase()) ||
    keys.has(slugify(pkg.name))
  );
}

export default async function ToolsPage() {
  const { userId } = await getSession();
  await connectDB();
  await ensureCatalogSeeded();

  const [snap, catalogDocs, myRequests] = await Promise.all([
    Snapshot.findOne({ userId }).sort({ capturedAt: -1 }).lean(),
    CatalogTool.find().select("slug name install.packageId").lean(),
    ToolRequest.find({ userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const packages = (snap?.packages as PackagesSection | undefined)?.packages ?? [];
  const devTools: DeveloperTool[] =
    (snap?.machine as MachineSection | undefined)?.developer_tools ?? [];

  const keys = catalogKeys(catalogDocs as unknown as CatalogKeyDoc[]);
  const requests = myRequests as unknown as RequestDoc[];
  const requestedNames = new Set(requests.map((r) => r.name.toLowerCase()));

  const bySource = packages.reduce<Record<string, InstalledPackage[]>>((acc, pkg) => {
    const src = pkg.source ?? "unknown";
    (acc[src] ??= []).push(pkg);
    return acc;
  }, {});
  const sourceCounts = Object.entries(bySource).sort((a, b) => b[1].length - a[1].length);

  const coveredCount = packages.filter((p) => inCatalog(keys, p)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-amber-400">Dev Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {packages.length} packages across {Object.keys(bySource).length} package managers ·{" "}
          {coveredCount} in the catalog
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
                <div
                  key={tool.name}
                  className="flex items-center gap-2 border border-border rounded-md px-3 py-1.5 text-sm"
                >
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

      {/* Packages by source, with catalog coverage */}
      {sourceCounts.map(([source, pkgs]) => (
        <Card key={source}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="capitalize">{source}</span>
              <Badge variant="outline" className="text-xs ml-auto">
                {pkgs.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1">
              {pkgs.map((pkg) => {
                const covered = inCatalog(keys, pkg);
                return (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between py-1.5 border-b border-border/40 text-sm"
                  >
                    <span className="font-mono text-xs truncate max-w-[55%]">{pkg.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs font-mono">
                        {pkg.version ?? "—"}
                      </Badge>
                      {covered ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-emerald-400"
                          title="In the tool catalog"
                        >
                          <Check className="w-3 h-3" /> catalog
                        </span>
                      ) : (
                        <RequestToolButton
                          name={pkg.name}
                          manager={source}
                          packageId={pkg.id}
                          version={pkg.version}
                          alreadyRequested={requestedNames.has(pkg.name.toLowerCase())}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {packages.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No packages found. Run <code className="bg-muted px-1 rounded">odin snapshot</code> to
            capture your environment.
          </CardContent>
        </Card>
      )}

      {/* My catalog requests */}
      {requests.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookMarked className="w-4 h-4" /> My Catalog Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {requests.map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 text-sm last:border-0"
              >
                <div className="min-w-0">
                  <span className="font-mono text-xs">{r.name}</span>
                  {r.status === "needs_correction" && r.correctionNote && (
                    <p className="text-xs text-orange-400 truncate">{r.correctionNote}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${STATUS_COLORS[r.status] ?? ""}`}
                >
                  {r.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
