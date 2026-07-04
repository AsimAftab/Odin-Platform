import { buildCommand } from "@/lib/catalog-util";
import { isSecret } from "@/lib/redact";
import type {
  EnvironmentSection,
  GitSection,
  InstalledPackage,
  PackagesSection,
  VsCodeSection,
} from "@/types/snapshot";

// Generates a best-effort PowerShell bootstrap script from a snapshot payload:
// reinstall packages (per-manager commands via buildCommand), VS Code
// extensions, git global config, and user env vars. It's a convenience, not a
// signed installer — the header tells the user to review before running.
//
// Secret-bearing env vars (detected via lib/redact) are emitted as commented-out
// placeholders so the script never carries credentials in cleartext.

type SnapshotLike = {
  machine?: { hostname?: string } | Record<string, unknown>;
  packages?: unknown;
  vscode?: unknown;
  git?: unknown;
  environment?: unknown;
  capturedAt?: Date | string;
};

// Snapshot package `source` -> catalog-util manager name.
const SOURCE_TO_MANAGER: Record<string, string> = {
  winget: "winget",
  chocolatey: "chocolatey",
  scoop: "scoop",
  npm: "npm",
  pip: "pip",
  cargo: "cargo",
};

function psEscape(value: string): string {
  // Single-quoted PowerShell string: escape embedded single quotes by doubling.
  return value.replace(/'/g, "''");
}

export function buildRestoreScript(snap: SnapshotLike): string {
  const hostname =
    (snap.machine as { hostname?: string } | undefined)?.hostname ?? "unknown";
  const captured = snap.capturedAt ? new Date(snap.capturedAt).toISOString() : "";
  const packages =
    (snap.packages as PackagesSection | undefined)?.packages ?? [];
  const extensions =
    (snap.vscode as VsCodeSection | undefined)?.extensions ?? [];
  const gitEntries = (snap.git as GitSection | undefined)?.entries ?? [];
  const envVars = (
    (snap.environment as EnvironmentSection | undefined)?.user_variables ?? []
  ).filter((v) => !v.name.toUpperCase().includes("PATH"));

  const lines: string[] = [];
  lines.push("# Odin restore script");
  lines.push(`# Machine: ${hostname}${captured ? `  Captured: ${captured}` : ""}`);
  lines.push("#");
  lines.push("# REVIEW THIS SCRIPT BEFORE RUNNING IT. It reinstalls packages and");
  lines.push("# rewrites git config and user environment variables. Secret-looking");
  lines.push("# env vars are commented out — fill them in yourself.");
  lines.push('$ErrorActionPreference = "Continue"');
  lines.push("");

  // Packages grouped by source.
  const bySource = packages.reduce<Record<string, InstalledPackage[]>>(
    (acc, p) => {
      const src = p.source ?? "unknown";
      (acc[src] ??= []).push(p);
      return acc;
    },
    {}
  );

  lines.push("# --- Packages ---");
  for (const [source, pkgs] of Object.entries(bySource)) {
    const manager = SOURCE_TO_MANAGER[source];
    lines.push(`# ${source} (${pkgs.length})`);
    for (const p of pkgs) {
      if (!manager) {
        lines.push(`# (manual) ${p.name} ${p.version ?? ""}`.trimEnd());
        continue;
      }
      lines.push(buildCommand(manager, p.id ?? p.name));
    }
    lines.push("");
  }

  // VS Code extensions.
  if (extensions.length) {
    lines.push("# --- VS Code extensions ---");
    for (const e of extensions) {
      lines.push(`code --install-extension ${e.identifier}`);
    }
    lines.push("");
  }

  // Git global config.
  if (gitEntries.length) {
    lines.push("# --- Git config (global) ---");
    for (const entry of gitEntries) {
      lines.push(
        `git config --global '${psEscape(entry.key)}' '${psEscape(entry.value)}'`
      );
    }
    lines.push("");
  }

  // User environment variables (secrets commented out).
  if (envVars.length) {
    lines.push("# --- User environment variables ---");
    for (const v of envVars) {
      const value = v.value ?? "";
      if (isSecret(v.name, value)) {
        lines.push(`# setx ${v.name} '<REDACTED — set manually>'`);
      } else {
        lines.push(`setx ${v.name} '${psEscape(value)}'`);
      }
    }
    lines.push("");
  }

  lines.push('Write-Host "Odin restore complete. Restart your shell for env changes."');
  lines.push("");
  return lines.join("\n");
}
