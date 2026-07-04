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

// Manager name -> the executable to probe for before running its section.
// Chocolatey's shim is `choco`, not the manager name.
const MANAGER_EXECUTABLE: Record<string, string> = {
  winget: "winget",
  chocolatey: "choco",
  scoop: "scoop",
  npm: "npm",
  pip: "pip",
  cargo: "cargo",
};

function psEscape(value: string): string {
  // Single-quoted PowerShell string: escape embedded single quotes by doubling.
  return value.replace(/'/g, "''");
}

// Package/extension ids are interpolated bare into executable script blocks, so
// they must not carry PowerShell metacharacters. Legitimate ids from every
// supported manager match this set; anything else (corrupt data or an injection
// attempt via a crafted snapshot) is skipped with a comment instead of run.
const SAFE_ID = /^[A-Za-z0-9._+@/:-]+$/;

function isSafeId(id: string): boolean {
  return SAFE_ID.test(id);
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
  // Failure tracking: every install step runs through Invoke-OdinStep so a
  // non-zero exit is collected into $failed and summarized at the end instead
  // of scrolling away.
  lines.push("$failed = @()");
  lines.push("$missingManagers = @()");
  lines.push("function Invoke-OdinStep([string]$Label, [scriptblock]$Cmd) {");
  lines.push("  & $Cmd");
  lines.push("  if ($LASTEXITCODE -ne 0) { $script:failed += $Label }");
  lines.push("}");
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

    if (!manager) {
      for (const p of pkgs) {
        lines.push(`# (manual) ${p.name} ${p.version ?? ""}`.trimEnd());
      }
      lines.push("");
      continue;
    }

    // Skip the whole section gracefully if the manager isn't installed on
    // this machine, instead of letting PowerShell print a wall of
    // "term not recognized" errors for every package.
    const exe = MANAGER_EXECUTABLE[manager];
    lines.push(`if (Get-Command ${exe} -ErrorAction SilentlyContinue) {`);
    for (const p of pkgs) {
      const id = p.id ?? p.name;
      if (!isSafeId(id)) {
        lines.push(`  # (skipped — id contains unsafe characters) ${psEscape(id)}`);
        continue;
      }
      lines.push(
        `  Invoke-OdinStep '${psEscape(`${id} (${source})`)}' { ${buildCommand(manager, id)} }`
      );
    }
    lines.push(`} else {`);
    lines.push(
      `  Write-Host "  ! ${exe} not found — skipping ${pkgs.length} ${source} package(s)"`
    );
    lines.push(`  $missingManagers += "${exe} (${pkgs.length} ${source} package(s))"`);
    lines.push(`}`);
    lines.push("");
  }

  // VS Code extensions.
  if (extensions.length) {
    lines.push("# --- VS Code extensions ---");
    lines.push("if (Get-Command code -ErrorAction SilentlyContinue) {");
    for (const e of extensions) {
      if (!isSafeId(e.identifier)) {
        lines.push(
          `  # (skipped — id contains unsafe characters) ${psEscape(e.identifier)}`
        );
        continue;
      }
      lines.push(
        `  Invoke-OdinStep '${psEscape(`${e.identifier} (vscode)`)}' { code --install-extension ${e.identifier} }`
      );
    }
    lines.push("} else {");
    lines.push(
      `  Write-Host "  ! VS Code (code) not found — skipping ${extensions.length} extension(s)"`
    );
    lines.push(`  $missingManagers += "code (${extensions.length} extension(s))"`);
    lines.push("}");
    lines.push("");
  }

  // Git global config.
  if (gitEntries.length) {
    lines.push("# --- Git config (global) ---");
    lines.push("if (Get-Command git -ErrorAction SilentlyContinue) {");
    for (const entry of gitEntries) {
      lines.push(
        `  Invoke-OdinStep '${psEscape(`git ${entry.key}`)}' { git config --global '${psEscape(entry.key)}' '${psEscape(entry.value)}' }`
      );
    }
    lines.push("} else {");
    lines.push('  Write-Host "  ! git not found — skipping git config"');
    lines.push('  $missingManagers += "git (config)"');
    lines.push("}");
    lines.push("");
  }

  // User environment variables (secrets commented out).
  if (envVars.length) {
    lines.push("# --- User environment variables ---");
    for (const v of envVars) {
      const value = v.value ?? "";
      if (!isSafeId(v.name)) {
        lines.push(`# (skipped — name contains unsafe characters) ${psEscape(v.name)}`);
      } else if (isSecret(v.name, value)) {
        lines.push(`# setx ${v.name} '<REDACTED — set manually>'`);
      } else {
        lines.push(`setx ${v.name} '${psEscape(value)}'`);
      }
    }
    lines.push("");
  }

  // End-of-run summary: mirrors the CLI's restore report — what failed and
  // which managers were missing, so problems don't scroll away.
  lines.push('Write-Host ""');
  lines.push('Write-Host "== Restore summary =="');
  lines.push("if ($missingManagers.Count) {");
  lines.push('  Write-Host ("  managers missing: " + ($missingManagers -join ", "))');
  lines.push("}");
  lines.push("if ($failed.Count) {");
  lines.push('  Write-Host ("  failed (" + $failed.Count + "):")');
  lines.push('  $failed | ForEach-Object { Write-Host "    - $_" }');
  lines.push("} else {");
  lines.push('  Write-Host "  no failures"');
  lines.push("}");
  lines.push('Write-Host "Odin restore complete. Restart your shell for env changes."');
  lines.push("");
  return lines.join("\n");
}
