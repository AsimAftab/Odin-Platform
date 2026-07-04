// Shapes of the snapshot payload sections as the Odin CLI serializes them
// (serde structs in Project-Odin src/models/*.rs — snake_case, verbatim).
// Stored as Schema.Types.Mixed on the Snapshot model, so these types are the
// single source of truth for dashboard reads.

export interface DeveloperTool {
  name: string;
  executable: string;
  path?: string | null;
  version?: string | null;
  install_source?: string | null;
  install_command?: string | null;
}

export interface PackageManagerInfo {
  name: string;
  installed: boolean;
  executable?: string | null;
  version?: string | null;
}

export interface MachineSection {
  snapshot_id: string;
  captured_at: string;
  hostname: string;
  username: string;
  os_name: string;
  os_version: string;
  kernel_version: string;
  cpu_brand: string;
  cpu_count: number;
  total_memory_bytes: number;
  shell: string;
  package_managers: PackageManagerInfo[];
  developer_tools: DeveloperTool[];
  powershell_profile_path?: string | null;
  terminal_settings_path?: string | null;
}

export interface EnvironmentVariable {
  name: string;
  value: string;
  scope: "process" | "user" | "machine";
}

export interface PathEntry {
  value: string;
  exists: boolean;
  source: "process" | "user" | "machine";
}

export interface ProfileFile {
  path: string;
  content: string;
  sha256: string;
}

export interface EnvironmentSection {
  user_variables: EnvironmentVariable[];
  machine_variables: EnvironmentVariable[];
  path_entries: PathEntry[];
  powershell_profile?: ProfileFile | null;
  terminal_settings?: ProfileFile | null;
}

export type PackageSource =
  | "winget"
  | "chocolatey"
  | "scoop"
  | "npm"
  | "pip"
  | "cargo"
  | "manual"
  | "unknown";

export interface InstalledPackage {
  id: string;
  name: string;
  version: string;
  source: PackageSource;
  install_command?: string | null;
}

export interface PackagesSection {
  packages: InstalledPackage[];
}

export interface VsCodeExtension {
  identifier: string;
  version: string;
}

export interface VsCodeSection {
  extensions: VsCodeExtension[];
}

export interface GitConfigEntry {
  key: string;
  value: string;
  origin?: string | null;
}

export interface GitSection {
  entries: GitConfigEntry[];
}

// Asgard profiles summary (optional 7th payload key, added post-v0.7.0).
export interface ProfileSummary {
  name: string;
  description?: string | null;
  startup_app_count: number;
  browser_url_count: number;
  has_vscode: boolean;
  app_names: string[];
}

export interface ProfilesSection {
  profiles: ProfileSummary[];
  active_profile?: string | null;
  activated_at?: string | null;
}
