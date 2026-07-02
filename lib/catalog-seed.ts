import type { ICatalogInstall } from "@/models/CatalogTool";

export interface CatalogSeedEntry {
  name: string;
  slug: string;
  category: string;
  description: string;
  homepage?: string;
  install: ICatalogInstall[];
  notes?: string;
}

// Curated starter catalog. Extend freely — the seed script upserts by slug,
// so re-running it updates existing entries and adds new ones.
export const CATALOG_SEED: CatalogSeedEntry[] = [
  {
    name: "Git",
    slug: "git",
    category: "Version Control",
    description: "Distributed version control system.",
    homepage: "https://git-scm.com",
    install: [
      { manager: "winget", command: "winget install Git.Git" },
      { manager: "chocolatey", command: "choco install git" },
      { manager: "scoop", command: "scoop install git" },
    ],
  },
  {
    name: "GitHub CLI",
    slug: "github-cli",
    category: "Version Control",
    description: "Work with GitHub issues, PRs, and repos from the terminal.",
    homepage: "https://cli.github.com",
    install: [
      { manager: "winget", command: "winget install GitHub.cli" },
      { manager: "scoop", command: "scoop install gh" },
    ],
  },
  {
    name: "PowerShell",
    slug: "powershell",
    category: "Terminals & Shells",
    description: "Cross-platform automation shell and scripting language.",
    homepage: "https://github.com/PowerShell/PowerShell",
    install: [
      { manager: "winget", command: "winget install Microsoft.PowerShell" },
      { manager: "chocolatey", command: "choco install powershell-core" },
    ],
  },
  {
    name: "Windows Terminal",
    slug: "windows-terminal",
    category: "Terminals & Shells",
    description: "Modern terminal for Windows with tabs, panes, and themes.",
    homepage: "https://github.com/microsoft/terminal",
    install: [
      { manager: "winget", command: "winget install Microsoft.WindowsTerminal" },
    ],
  },
  {
    name: "Visual Studio Code",
    slug: "vs-code",
    category: "Editors & IDEs",
    description: "Lightweight, extensible source-code editor.",
    homepage: "https://code.visualstudio.com",
    install: [
      { manager: "winget", command: "winget install Microsoft.VisualStudioCode" },
      { manager: "chocolatey", command: "choco install vscode" },
      { manager: "scoop", command: "scoop install vscode" },
    ],
  },
  {
    name: "Node.js (LTS)",
    slug: "nodejs-lts",
    category: "Languages & Runtimes",
    description: "JavaScript runtime built on Chrome's V8 engine.",
    homepage: "https://nodejs.org",
    install: [
      { manager: "winget", command: "winget install OpenJS.NodeJS.LTS" },
      { manager: "chocolatey", command: "choco install nodejs-lts" },
      { manager: "scoop", command: "scoop install nodejs-lts" },
    ],
  },
  {
    name: "Bun",
    slug: "bun",
    category: "Languages & Runtimes",
    description: "Fast all-in-one JavaScript runtime, bundler, and package manager.",
    homepage: "https://bun.sh",
    install: [
      { manager: "winget", command: "winget install Oven-sh.Bun" },
      { manager: "scoop", command: "scoop install bun" },
    ],
  },
  {
    name: "Python",
    slug: "python",
    category: "Languages & Runtimes",
    description: "General-purpose programming language.",
    homepage: "https://www.python.org",
    install: [
      { manager: "winget", command: "winget install Python.Python.3.12" },
      { manager: "chocolatey", command: "choco install python" },
      { manager: "scoop", command: "scoop install python" },
    ],
  },
  {
    name: "Go",
    slug: "go",
    category: "Languages & Runtimes",
    description: "Open-source language for building simple, reliable software.",
    homepage: "https://go.dev",
    install: [
      { manager: "winget", command: "winget install GoLang.Go" },
      { manager: "scoop", command: "scoop install go" },
    ],
  },
  {
    name: "Rust (rustup)",
    slug: "rust",
    category: "Languages & Runtimes",
    description: "Rust toolchain installer and version manager.",
    homepage: "https://rustup.rs",
    install: [
      { manager: "winget", command: "winget install Rustlang.Rustup" },
      { manager: "scoop", command: "scoop install rustup" },
    ],
  },
  {
    name: "Docker Desktop",
    slug: "docker-desktop",
    category: "Containers & Cloud",
    description: "Build and run containers locally on Windows.",
    homepage: "https://www.docker.com/products/docker-desktop",
    install: [
      { manager: "winget", command: "winget install Docker.DockerDesktop" },
      { manager: "chocolatey", command: "choco install docker-desktop" },
    ],
    notes: "Requires WSL 2. Enable virtualization in BIOS if it fails to start.",
  },
  {
    name: "kubectl",
    slug: "kubectl",
    category: "Containers & Cloud",
    description: "Command-line tool for controlling Kubernetes clusters.",
    homepage: "https://kubernetes.io/docs/reference/kubectl/",
    install: [
      { manager: "winget", command: "winget install Kubernetes.kubectl" },
      { manager: "scoop", command: "scoop install kubectl" },
    ],
  },
  {
    name: "7-Zip",
    slug: "7zip",
    category: "Utilities",
    description: "High-ratio file archiver.",
    homepage: "https://www.7-zip.org",
    install: [
      { manager: "winget", command: "winget install 7zip.7zip" },
      { manager: "chocolatey", command: "choco install 7zip" },
    ],
  },
  {
    name: "curl",
    slug: "curl",
    category: "Utilities",
    description: "Command-line tool for transferring data with URLs.",
    homepage: "https://curl.se",
    install: [
      { manager: "winget", command: "winget install cURL.cURL" },
      { manager: "scoop", command: "scoop install curl" },
    ],
  },
  {
    name: "Postman",
    slug: "postman",
    category: "Utilities",
    description: "API platform for building and testing APIs.",
    homepage: "https://www.postman.com",
    install: [
      { manager: "winget", command: "winget install Postman.Postman" },
      { manager: "chocolatey", command: "choco install postman" },
    ],
  },
  {
    name: "Notepad++",
    slug: "notepad-plus-plus",
    category: "Editors & IDEs",
    description: "Free source-code editor for Windows.",
    homepage: "https://notepad-plus-plus.org",
    install: [
      { manager: "winget", command: "winget install Notepad++.Notepad++" },
      { manager: "chocolatey", command: "choco install notepadplusplus" },
    ],
  },
];
