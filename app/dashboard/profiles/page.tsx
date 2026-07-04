import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, Globe, FolderOpen, AppWindow, Link2, Code2, CheckCircle } from "lucide-react";
import type { MachineSection, ProfilesSection } from "@/types/snapshot";

export default async function ProfilesPage() {
  const { userId } = await getSession();
  await connectDB();

  const snap = await Snapshot.findOne({ userId })
    .sort({ capturedAt: -1 })
    .lean();

  const machine = snap?.machine as MachineSection | undefined;
  const hostname = machine?.hostname ?? "unknown";
  const section = snap?.profiles as ProfilesSection | undefined;
  const profiles = section?.profiles ?? [];
  const activeProfile = section?.active_profile ?? null;
  const activatedAt = section?.activated_at ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-amber-400">Asgard Profiles</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Developer realm profiles from <span className="font-mono">{hostname}</span>
        </p>
      </div>

      {profiles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground space-y-2">
            <Cpu className="w-8 h-8 mx-auto text-amber-400/40" />
            <p className="text-sm font-medium">No profiles synced yet</p>
            <p className="text-xs max-w-sm mx-auto">
              Create a profile with <code className="bg-muted px-1 rounded">odin asgard</code>,
              then run <code className="bg-muted px-1 rounded">odin sync</code> to see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profiles.map((profile) => {
            const isActive = profile.name === activeProfile;
            return (
              <Card
                key={profile.name}
                className={isActive ? "border-amber-400/40" : undefined}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <span className="font-mono">{profile.name}</span>
                    {isActive && (
                      <Badge className="text-xs gap-1 bg-amber-400/10 text-amber-400 border-amber-400/20">
                        <CheckCircle className="w-3 h-3" /> active
                      </Badge>
                    )}
                  </CardTitle>
                  {profile.description && (
                    <p className="text-xs text-muted-foreground">{profile.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <AppWindow className="w-3 h-3" /> {profile.startup_app_count} app
                      {profile.startup_app_count === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> {profile.browser_url_count} URL
                      {profile.browser_url_count === 1 ? "" : "s"}
                    </span>
                    {profile.has_vscode && (
                      <span className="flex items-center gap-1">
                        <Code2 className="w-3 h-3" /> VS Code
                      </span>
                    )}
                  </div>
                  {profile.app_names?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {profile.app_names.map((app) => (
                        <Badge key={app} variant="outline" className="text-xs font-mono">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {isActive && activatedAt && (
                    <p className="text-xs text-muted-foreground">
                      activated {new Date(activatedAt).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
                .filter((pm) => pm.installed)
                .map((pm) => (
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
