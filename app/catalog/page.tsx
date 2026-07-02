import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { CatalogTool } from "@/models/CatalogTool";
import { ensureCatalogSeeded } from "@/lib/ensure-catalog";
import { CatalogClient, type CatalogToolDTO } from "./catalog-client";
import { Boxes } from "lucide-react";

export const metadata: Metadata = {
  title: "Tool Catalog · Odin Platform",
  description:
    "Browse install commands for developer tools — winget, Chocolatey, and Scoop ids in one open catalog.",
};

export default async function CatalogPage() {
  const { userId } = await getSession();
  await connectDB();
  await ensureCatalogSeeded();

  const docs = await CatalogTool.find({})
    .select("name slug category description homepage install notes")
    .sort({ category: 1, name: 1 })
    .lean();

  const tools: CatalogToolDTO[] = docs.map((d) => ({
    name: d.name,
    slug: d.slug,
    category: d.category,
    description: d.description ?? "",
    homepage: d.homepage,
    install: (d.install ?? []).map((i: { manager: string; command: string }) => ({
      manager: i.manager,
      command: i.command,
    })),
    notes: d.notes,
  }));

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-base font-bold text-amber-400">
              ᚢ
            </span>
            <span className="text-[0.95rem] font-semibold tracking-tight text-white">Odin</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="rounded-md px-3 py-2 text-sm text-neutral-400 transition hover:text-white"
            >
              Home
            </Link>
            <Link
              href={userId ? "/dashboard" : "/sign-in"}
              className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
            >
              {userId ? "Dashboard" : "Sign in"}
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-12 md:px-8 md:py-16">
        <div className="mb-10 max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-amber-400/90">
            <Boxes className="size-4" />
            Tool catalog
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Install commands for every tool.
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-400">
            One open catalog of developer tools with their winget, Chocolatey, and Scoop ids.
            Copy a command, or request a tool that&apos;s missing.
          </p>
        </div>

        {tools.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-16 text-center text-neutral-500">
            The catalog is empty. Run{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-neutral-300">
              bun run seed:catalog
            </code>{" "}
            to populate it.
          </div>
        ) : (
          <CatalogClient tools={tools} isAuthed={!!userId} />
        )}
      </div>
    </main>
  );
}
