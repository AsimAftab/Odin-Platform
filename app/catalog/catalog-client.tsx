"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Info,
  Plus,
  Search,
  Loader2,
} from "lucide-react";

export interface CatalogInstallDTO {
  manager: string;
  command: string;
}
export interface CatalogToolDTO {
  name: string;
  slug: string;
  category: string;
  description: string;
  homepage?: string;
  install: CatalogInstallDTO[];
  notes?: string;
}

const MANAGER_COLORS: Record<string, string> = {
  winget: "text-blue-300 border-blue-400/20 bg-blue-400/5",
  chocolatey: "text-orange-300 border-orange-400/20 bg-orange-400/5",
  scoop: "text-purple-300 border-purple-400/20 bg-purple-400/5",
  npm: "text-red-300 border-red-400/20 bg-red-400/5",
  manual: "text-neutral-300 border-white/15 bg-white/5",
};

export function CatalogClient({
  tools,
  isAuthed,
}: {
  tools: CatalogToolDTO[];
  isAuthed: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(tools.map((t) => t.category))).sort(),
    [tools]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((t) => {
      if (category && t.category !== category) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
      );
    });
  }, [tools, query, category]);

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools…"
            className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip active={category === null} onClick={() => setCategory(null)}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-neutral-500">
        {filtered.length} tool{filtered.length !== 1 ? "s" : ""}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-14 text-center text-neutral-500">
          No tools match “{query}”.
        </div>
      )}

      <RequestTool isAuthed={isAuthed} />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1 text-xs font-medium transition " +
        (active
          ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
          : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-white")
      }
    >
      {children}
    </button>
  );
}

function ToolCard({ tool }: { tool: CatalogToolDTO }) {
  return (
    <div className="flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{tool.name}</h3>
          <span className="mt-1 inline-block text-xs text-amber-400/90">{tool.category}</span>
        </div>
        {tool.homepage && (
          <a
            href={tool.homepage}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-neutral-500 transition hover:text-white"
            aria-label={`${tool.name} homepage`}
          >
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>

      {tool.description && (
        <p className="mt-2 text-sm leading-6 text-neutral-400">{tool.description}</p>
      )}

      <div className="mt-4 space-y-2">
        {tool.install.map((inst) => (
          <InstallRow key={inst.manager} install={inst} />
        ))}
      </div>

      {tool.notes && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/15 bg-amber-400/5 p-2.5 text-xs text-amber-200/80">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>{tool.notes}</span>
        </div>
      )}
    </div>
  );
}

function InstallRow({ install }: { install: CatalogInstallDTO }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(install.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const color = MANAGER_COLORS[install.manager] ?? MANAGER_COLORS.manual;

  return (
    <div className="flex items-center gap-2">
      <span
        className={"w-20 shrink-0 rounded border px-1.5 py-0.5 text-center text-[0.65rem] font-medium " + color}
      >
        {install.manager}
      </span>
      <code className="min-w-0 flex-1 truncate rounded-md bg-black/40 px-2.5 py-1.5 font-mono text-xs text-neutral-300">
        {install.command}
      </code>
      <button
        onClick={copy}
        className="shrink-0 rounded-md border border-white/10 p-1.5 text-neutral-400 transition hover:border-white/25 hover:text-white"
        aria-label="Copy command"
      >
        {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

function RequestTool({ isAuthed }: { isAuthed: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/catalog/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, notes }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Could not submit your request. Please try again.");
      return;
    }
    setDone(true);
    setName("");
    setNotes("");
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
      <div className="flex items-center gap-2">
        <Plus className="size-4 text-amber-400" />
        <h2 className="text-base font-semibold text-white">Missing a tool?</h2>
      </div>
      <p className="mt-1 text-sm text-neutral-400">
        Request a tool and the maintainers will review it for the catalog.
      </p>

      {!isAuthed ? (
        <Link
          href="/sign-in?redirect=/catalog"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:border-white/25 hover:text-white"
        >
          Sign in to request a tool
          <ArrowRight className="size-3.5" />
        </Link>
      ) : done ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">
          <Check className="size-4" />
          Request submitted — thanks! You can request another anytime.
          <button
            onClick={() => setDone(false)}
            className="ml-auto text-emerald-200/70 underline-offset-2 hover:underline"
          >
            Request another
          </button>
        </div>
      ) : open ? (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tool name (e.g. Neovim)"
            required
            className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything useful — package id, homepage, why you need it (optional)"
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-amber-400 px-4 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300 disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Submit request
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center rounded-md border border-white/10 px-4 text-sm text-neutral-300 transition hover:border-white/25 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
        >
          <Plus className="size-4" />
          Request a tool
        </button>
      )}
    </div>
  );
}
