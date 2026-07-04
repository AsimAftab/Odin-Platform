export const INSTALL_MANAGERS = [
  "winget",
  "chocolatey",
  "scoop",
  "npm",
  "pip",
  "cargo",
  "manual",
] as const;

export type InstallManager = (typeof INSTALL_MANAGERS)[number];

/** URL-friendly slug from a tool name, e.g. "Visual Studio Code" -> "visual-studio-code". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Builds a safe, unattended install command from a manager + structured package
 * id. The CLI can rebuild the same command locally instead of trusting a raw
 * string. For "manual", the packageId is treated as a URL/instruction.
 */
export function buildCommand(manager: string, packageId: string): string {
  const id = packageId.trim();
  switch (manager) {
    case "winget":
      return `winget install --id ${id} -e --accept-package-agreements --accept-source-agreements`;
    case "chocolatey":
      return `choco install ${id} -y`;
    case "scoop":
      return `scoop install ${id}`;
    case "npm":
      return `npm install -g ${id}`;
    case "pip":
      return `pip install ${id}`;
    case "cargo":
      return `cargo install ${id}`;
    case "manual":
    default:
      return id;
  }
}
