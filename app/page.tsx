import Link from "next/link";
import { getSession } from "@/lib/session";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  GitBranch,
  HeartPulse,
  Package,
  PlugZap,
  ShieldCheck,
  Terminal,
  TerminalSquare,
} from "lucide-react";

const GITHUB_URL = "https://github.com/AsimAftab/Odin-Platform";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.31-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.87.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

const captures = [
  {
    icon: Package,
    title: "Packages",
    text: "winget, npm globals, and PATH tools captured with their exact install commands.",
  },
  {
    icon: TerminalSquare,
    title: "VS Code",
    text: "Every extension and editor setting recorded so a new machine feels like home.",
  },
  {
    icon: GitBranch,
    title: "Git config",
    text: "User identity, aliases, and global settings versioned with each snapshot.",
  },
  {
    icon: HeartPulse,
    title: "PATH health",
    text: "Broken entries and missing binaries flagged before they cost you an afternoon.",
  },
];

const steps = [
  {
    title: "Create an account",
    text: "Generate a scoped platform token from your dashboard — shown once, stored hashed.",
  },
  {
    title: "Connect the CLI",
    text: "Save the token locally with odin login and keep every snapshot portable.",
  },
  {
    title: "Push a snapshot",
    text: "odin snapshot --push captures the machine and syncs it here in seconds.",
  },
  {
    title: "Restore anywhere",
    text: "Export Odin-compatible data and rebuild any workstation from a clean install.",
  },
];

const openSource = [
  {
    icon: ShieldCheck,
    title: "MIT licensed",
    text: "Use it, fork it, ship it commercially. No strings, no seat limits, no surprise pricing.",
  },
  {
    icon: Terminal,
    title: "Self-hostable",
    text: "Run the whole platform on your own infrastructure and keep every byte under your roof.",
  },
  {
    icon: GitBranch,
    title: "Open data format",
    text: "Snapshots use documented, Odin-compatible shapes — export anytime, zero lock-in.",
  },
  {
    icon: Boxes,
    title: "Public codebase",
    text: "The CLI and this platform are fully on GitHub. Audit it, learn from it, improve it.",
  },
  {
    icon: HeartPulse,
    title: "Community-driven",
    text: "Issues, feature requests, and pull requests are welcome — the roadmap is built in the open.",
  },
  {
    icon: CheckCircle2,
    title: "Free forever",
    text: "The core product is free. Support the project by starring, contributing, or self-hosting.",
  },
];

const snapshotRows = [
  ["RAVEN-17", "289 packages", "14m ago"],
  ["WORKSTATION", "184 packages", "2h ago"],
  ["LAPTOP-NORTH", "91 packages", "yesterday"],
];

const guarantees = [
  "Local snapshots always stay in ~/.odin",
  "GitHub sync remains fully supported",
  "Dashboard records are scoped per user",
  "API tokens are hashed and shown once",
  "Exports use open Odin data shapes",
  "Self-hosting is on the roadmap",
];

export default async function Home() {
  const { userId } = await getSession();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-200 antialiased selection:bg-amber-400/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-base font-bold text-amber-400">
              ᚢ
            </span>
            <span className="text-[0.95rem] font-semibold tracking-tight text-white">Odin</span>
            <span className="rounded border border-white/10 px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wider text-neutral-500">
              Platform
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/catalog"
              className="hidden rounded-md px-3 py-2 text-sm text-neutral-400 transition hover:text-white sm:inline-flex"
            >
              Catalog
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-400 transition hover:text-white sm:inline-flex"
            >
              <GitHubIcon className="size-4" />
              GitHub
            </a>
            {userId ? (
              <Link
                href="/dashboard"
                className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
              >
                Dashboard
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-md px-3 py-2 text-sm text-neutral-300 transition hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
                >
                  Get started
                  <ArrowRight className="size-3.5" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(251,191,36,0.10),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]" />

        <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-16 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
          <div>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-neutral-300 transition hover:border-white/20"
            >
              <span className="flex size-1.5 rounded-full bg-amber-400" />
              Open source · Windows-first
              <span className="text-neutral-500">·</span>
              <span className="inline-flex items-center gap-1 text-neutral-400">
                Star on GitHub <ArrowRight className="size-3" />
              </span>
            </a>

            <h1 className="max-w-xl bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-4xl font-semibold leading-[1.05] tracking-tight text-transparent md:text-6xl">
              Back up the machine behind your work.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-neutral-400">
              Odin captures your packages, VS Code extensions, Git config, and PATH health into
              portable snapshots — then restores them on any workstation from a clean install.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={userId ? "/dashboard" : "/sign-up"}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
              >
                {userId ? "Open dashboard" : "Start for free"}
                <ArrowRight className="size-4" />
              </Link>
              {!userId && (
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center rounded-md border border-white/10 px-5 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-white/25 hover:bg-white/[0.03]"
                >
                  Sign in
                </Link>
              )}
            </div>

            <div className="mt-8 flex max-w-md items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-mono text-sm">
              <span className="text-neutral-600 select-none">$</span>
              <span className="truncate text-neutral-300">winget install AsimAftab.Odin</span>
            </div>
          </div>

          {/* Product mock */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-b from-amber-400/10 to-transparent blur-2xl" />
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0e0e0e] shadow-2xl shadow-black/60">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="ml-2 font-mono text-xs text-neutral-500">odin — snapshot</span>
              </div>

              <div className="space-y-1.5 px-4 py-4 font-mono text-[0.8rem] leading-6">
                <p>
                  <span className="text-neutral-600">$ </span>
                  <span className="text-amber-300">odin snapshot --push</span>
                </p>
                <p className="text-neutral-400">
                  <span className="text-emerald-400">✔</span> Captured 289 packages · 42 extensions
                </p>
                <p className="text-neutral-400">
                  <span className="text-emerald-400">✔</span> Git config + PATH health verified
                </p>
                <p className="text-neutral-400">
                  <span className="text-emerald-400">✔</span> Synced to Odin Platform{" "}
                  <span className="text-neutral-600">(RAVEN-17)</span>
                </p>
              </div>

              <div className="space-y-2 border-t border-white/[0.06] p-4">
                {snapshotRows.map(([machine, count, time]) => (
                  <div
                    key={machine}
                    className="flex items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      <span className="font-mono text-sm text-neutral-200">{machine}</span>
                      <span className="text-xs text-neutral-500">{count}</span>
                    </div>
                    <span className="text-xs text-neutral-500">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inside a snapshot */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
          <div className="mb-12 max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-amber-400/90">
              <Boxes className="size-4" />
              Inside a snapshot
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Everything that makes a machine yours.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {captures.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="mb-5 inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-amber-400">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-[0.95rem] font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
          <div className="mb-12 max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-amber-400/90">
              <PlugZap className="size-4" />
              How it works
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              From clean install to fully restored.
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ title, text }, i) => (
              <div key={title} className="bg-[#0c0c0c] p-6">
                <span className="mb-5 flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] font-mono text-sm font-semibold text-amber-400">
                  {i + 1}
                </span>
                <h3 className="text-[0.95rem] font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portable / no lock-in */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-amber-400/90">
              <GitBranch className="size-4" />
              Portable by design
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Hosted backup, without the lock-in.
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-400">
              The platform stores open, Odin-compatible snapshot data. Export it, push it to GitHub,
              move it to another machine, or self-host the backend when you want full control.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-400 transition hover:text-amber-300"
            >
              <GitHubIcon className="size-4" />
              View the source
              <ArrowRight className="size-3.5" />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {guarantees.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 text-sm text-neutral-300"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open source */}
      <section className="border-t border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
          <div className="mb-12 max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-amber-400/90">
              <GitHubIcon className="size-4" />
              Open source
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Free, transparent, and yours to run.
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-400">
              Odin is fully open source — every line of the CLI and this platform is public. No paywalls,
              no telemetry you can&apos;t inspect, no vendor holding your data hostage.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openSource.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-xl border border-white/[0.08] bg-[#0c0c0c] p-6"
              >
                <div className="mb-4 inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-amber-400">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-[0.95rem] font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              <GitHubIcon className="size-4" />
              Star on GitHub
            </a>
            <a
              href={`${GITHUB_URL}/issues`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-5 py-2.5 text-sm font-medium text-neutral-300 transition hover:border-white/25 hover:text-white"
            >
              Report an issue
              <ArrowRight className="size-3.5" />
            </a>
            <a
              href={`${GITHUB_URL}/blob/main/CONTRIBUTING.md`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-5 py-2.5 text-sm font-medium text-neutral-300 transition hover:border-white/25 hover:text-white"
            >
              Contribute
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06]">
        <div className="relative mx-auto max-w-6xl overflow-hidden px-5 py-24 text-center md:px-8">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(50%_100%_at_50%_100%,rgba(251,191,36,0.10),transparent_70%)]" />
          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-neutral-300">
              <ShieldCheck className="size-3.5 text-amber-400" />
              Free · MIT licensed
            </div>
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Give your workstation a memory.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-neutral-400">
              Create an account, connect the Odin CLI, and push your first snapshot in under a
              minute.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={userId ? "/dashboard" : "/sign-up"}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
              >
                {userId ? "Open dashboard" : "Start for free"}
                <ArrowRight className="size-4" />
              </Link>
              {!userId && (
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center rounded-md border border-white/10 px-5 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-white/25 hover:bg-white/[0.03]"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded border border-white/10 bg-white/5 text-xs font-bold text-amber-400">
              ᚢ
            </span>
            <span>Odin CLI + Platform · Open source, Windows-first, migration-ready.</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-neutral-200"
            >
              <GitHubIcon className="size-4" />
              GitHub
            </a>
            <Link
              href={userId ? "/dashboard" : "/sign-in"}
              className="transition hover:text-neutral-200"
            >
              {userId ? "Dashboard" : "Sign in"}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
