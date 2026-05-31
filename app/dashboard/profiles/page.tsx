import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, Globe, FolderOpen } from "lucide-react";

export default async function ProfilesPage() {
  const { userId } = await auth();
  await connectDB();

  const snap = await Snapshot.findOne({ userId })
    .sort({ capturedAt: -1 })
    .lean();

  // Asgard profiles are stored in machine.developer_tools or a separate field
  // For now surface what we have from the machine snapshot
  const machine = snap?.machine as any;
  const hostname = machine?.hostname ?? "unknown";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-yellow-400">Asgard Profiles</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Developer realm profiles from <span className="font-mono">{hostname}</span>
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground space-y-2">
          <Cpu className="w-8 h-8 mx-auto text-yellow-400/40" />
          <p className="text-sm font-medium">Profile sync coming soon</p>
          <p className="text-xs max-w-sm mx-auto">
            Asgard profiles will be included in the next snapshot push. Manage profiles
            locally with <code className="bg-muted px-1 rounded">odin profile</code>.
          </p>
        </CardContent>
      </Card>

      {/* Machine info as context */}
      {machine && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Machine Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-3 h-3" />
              <span className="font-mono">{machine.os_name} {machine.os_version}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FolderOpen className="w-3 h-3" />
              <span className="font-mono text-xs">{machine.shell}</span>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {(machine.package_managers ?? [])
                .filter((pm: any) => pm.installed)
                .map((pm: any) => (
                  <Badge key={pm.name} variant="outline" className="text-xs">
                    {pm.name} {pm.version ? `· ${pm.version.trim()}` : ""}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
