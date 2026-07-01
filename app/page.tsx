import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  GitBranch,
  HeartPulse,
  KeyRound,
  Package,
  PlugZap,
  ShieldCheck,
  Terminal,
  TerminalSquare,
} from "lucide-react";

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
    text: "User identity, aliases, and global settings versioned alongside each snapshot.",
  },
  {
    icon: HeartPulse,
    title: "PATH health",
    text: "Broken entries and missing binaries flagged before they cost you an afternoon.",
  },
];

const steps = [
  {
    icon: KeyRound,
    title: "Create an account",
    text: "Generate a scoped platform token from your dashboard — shown once, stored hashed.",
  },
  {
    icon: PlugZap,
    title: "Connect the CLI",
    text: "Save the token locally with odin login and keep every snapshot portable.",
  },
  {
    icon: Terminal,
    title: "Push a snapshot",
    text: "odin snapshot --push captures the machine and syncs it here in seconds.",
  },
  {
    icon: ArrowRight,
    title: "Restore anywhere",
    text: "Export Odin-compatible data and rebuild any workstation from a clean install.",
  },
];

const snapshotRows = [
  ["RAVEN-17", "289 packages", "14 min ago"],
  ["WORKSTATION", "184 packages", "2 hr ago"],
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
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-[#0b0c0a] text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-stone-800/70 bg-[#0b0c0a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-xl font-black tracking-tight text-yellow-300">ᚢ Odin</span>
            <span className="text-[0.65rem] uppercase tracking-[0.3em] text-stone-500">
              Platform
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            {userId ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-2 text-sm text-stone-300 transition hover:text-yellow-200"
                >
                  Dashboard
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-md px-3 py-2 text-sm text-stone-300 transition hover:text-yellow-200"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-1.5 rounded-md bg-yellow-300 px-3.5 py-2 text-sm font-semibold text-stone-950 transition hover:bg-yellow-200"
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
      <section className="relative overflow-hidden border-b border-stone-800/70">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(250,204,21,0.04)_1px,transparent_1px),linear-gradient(rgba(250,204,21,0.03)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-yellow-200">
              <ShieldCheck className="size-3.5" />
              Open source · Windows-first
            </div>

            <h1 className="text-balance text-4xl font-black leading-[1.02] tracking-tight text-stone-50 md:text-6xl">
              Back up the machine
              <br />
              behind your work.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-300">
              Odin captures your packages, VS Code extensions, Git config, and PATH health into
              portable snapshots — then restores them on any workstation from a clean install.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={userId ? "/dashboard" : "/sign-up"}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-yellow-300 px-5 py-3 text-sm font-bold text-stone-950 transition hover:bg-yellow-200"
              >
                {userId ? "Open dashboard" : "Create your account"}
                <ArrowRight className="size-4" />
              </Link>
              {!userId && (
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center rounded-md border border-stone-700 px-5 py-3 text-sm font-semibold text-stone-200 transition hover:border-yellow-300/50 hover:text-yellow-200"
                >
                  Sign in
                </Link>
              )}
            </div>

            <div className="mt-6 flex min-w-0 max-w-md items-center gap-2 rounded-md border border-stone-800 bg-stone-950/70 px-4 py-3 font-mono text-sm text-yellow-200">
              <Terminal className="size-4 shrink-0 text-stone-500" />
              <span className="truncate">winget install AsimAftab.Odin</span>
            </div>
          </div>

          {/* Terminal / snapshot mock */}
          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-stone-800 bg-[#111310] shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 border-b border-stone-800 px-4 py-3">
                <span className="size-3 rounded-full bg-red-400/70" />
                <span className="size-3 rounded-full bg-yellow-400/70" />
                <span className="size-3 rounded-full bg-green-400/70" />
                <span className="ml-2 font-mono text-xs text-stone-500">odin — snapshot</span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[0.8rem] leading-6 text-stone-300">
                <span className="text-stone-500">$ </span>
                <span className="text-yellow-200">odin snapshot --push</span>
                {`
`}
                <span className="text-green-300">✔</span> Captured 289 packages · 42 extensions
                {`
`}
                <span className="text-green-300">✔</span> Git config + PATH health verified
                {`
`}
                <span className="text-green-300">✔</span> Synced to Odin Platform{"  "}
                <span className="text-stone-500">(RAVEN-17)</span>
              </pre>

              <div className="grid gap-2 border-t border-stone-800 p-4">
                {snapshotRows.map(([machine, count, time]) => (
                  <div
                    key={machine}
                    className="flex items-center justify-between rounded-md border border-stone-800 bg-stone-950/50 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-green-400" />
                      <span className="font-mono text-sm text-stone-100">{machine}</span>
                      <span className="text-xs text-stone-500">{count}</span>
                    </div>
                    <span className="text-xs text-stone-500">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What a snapshot captures */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="mb-10 max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-yellow-200">
            <Boxes className="size-4" />
            Inside a snapshot
          </div>
          <h2 className="text-3xl font-black tracking-tight text-stone-50 md:text-4xl">
            Everything that makes a machine yours.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {captures.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-lg border border-stone-800 bg-stone-950/40 p-5 transition hover:border-yellow-300/40 hover:bg-stone-950/70"
            >
              <div className="mb-4 inline-flex rounded-md border border-stone-800 bg-stone-900/60 p-2 text-yellow-300">
                <Icon className="size-5" />
              </div>
              <h3 className="text-base font-bold text-stone-50">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-stone-800/70 bg-stone-950/40">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <div className="mb-10 max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-yellow-200">
              <PlugZap className="size-4" />
              How it works
            </div>
            <h2 className="text-3xl font-black tracking-tight text-stone-50 md:text-4xl">
              From clean install to fully restored.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="relative rounded-lg border border-stone-800 bg-[#111310] p-5"
              >
                <span className="mb-4 flex size-9 items-center justify-center rounded-md bg-yellow-300/10 font-mono text-sm font-bold text-yellow-300">
                  {i + 1}
                </span>
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="size-4 text-yellow-300" />
                  <h3 className="text-base font-bold text-stone-50">{title}</h3>
                </div>
                <p className="text-sm leading-6 text-stone-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portable / no lock-in */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-yellow-200">
              <GitBranch className="size-4" />
              Portable by design
            </div>
            <h2 className="text-3xl font-black tracking-tight text-stone-50 md:text-4xl">
              Hosted backup, without the lock-in.
            </h2>
            <p className="mt-4 text-base leading-7 text-stone-400">
              The platform stores open, Odin-compatible snapshot data. Export it, push it to GitHub,
              move it to another machine, or self-host the backend when you want full control.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {guarantees.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-lg border border-stone-800 bg-stone-950/50 p-4 text-sm text-stone-300"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-800/70 bg-stone-950/40">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:px-8 md:py-20">
          <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight text-stone-50 md:text-4xl">
            Give your workstation a memory.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-stone-400">
            Create an account, connect the Odin CLI, and push your first snapshot in under a minute.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={userId ? "/dashboard" : "/sign-up"}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-yellow-300 px-5 py-3 text-sm font-bold text-stone-950 transition hover:bg-yellow-200"
            >
              {userId ? "Open dashboard" : "Create your account"}
              <ArrowRight className="size-4" />
            </Link>
            {!userId && (
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-md border border-stone-700 px-5 py-3 text-sm font-semibold text-stone-200 transition hover:border-yellow-300/50 hover:text-yellow-200"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800/70 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-stone-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-yellow-300">ᚢ</span>
            <span>Odin CLI + Odin Platform. Open source, Windows-first, migration-ready.</span>
          </div>
          <Link
            href={userId ? "/dashboard" : "/sign-in"}
            className="text-stone-300 transition hover:text-yellow-200"
          >
            {userId ? "Go to dashboard" : "Sign in to connect a machine"}
          </Link>
        </div>
      </footer>
    </main>
  );
}
