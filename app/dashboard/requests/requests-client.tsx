"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INSTALL_MANAGERS, buildCommand } from "@/lib/catalog-util";
import { STATUS_COLORS } from "@/lib/status-colors";
import {
  Check,
  X,
  Trash2,
  Clock,
  Loader2,
  Inbox,
  Plus,
  ChevronDown,
  ChevronUp,
  Play,
  BadgeCheck,
  CircleAlert,
} from "lucide-react";

export interface InstallDTO {
  manager: string;
  packageId: string;
  command: string;
}
export interface ToolRequestDTO {
  id: string;
  name: string;
  notes: string;
  description: string;
  category: string;
  homepage: string;
  correctionNote: string;
  install: InstallDTO[];
  status:
    | "pending"
    | "in_progress"
    | "needs_correction"
    | "verified"
    | "approved"
    | "rejected";
  createdAt: string;
  requesterName: string;
  requesterEmail: string;
}

type Status = ToolRequestDTO["status"];

// Shared with the tools page's "My Catalog Requests" view.
const STATUS_STYLE: Record<Status, string> = STATUS_COLORS as Record<Status, string>;
const STATUS_LABEL: Record<Status, string> = {
  pending: "pending",
  in_progress: "in progress",
  needs_correction: "needs correction",
  verified: "verified",
  approved: "approved",
  rejected: "rejected",
};

const FILTERS = [
  "all",
  "pending",
  "in_progress",
  "needs_correction",
  "verified",
  "approved",
  "rejected",
] as const;
type Filter = (typeof FILTERS)[number];

export function RequestsClient({
  initialRequests,
}: {
  initialRequests: ToolRequestDTO[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<Filter>("all");

  const counts = requests.reduce(
    (acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc),
    {} as Record<string, number>
  );
  const visible = requests.filter((r) => filter === "all" || r.status === filter);

  function onChanged(updated: ToolRequestDTO) {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }
  function onRemoved(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "rounded-full border px-3 py-1 text-xs font-medium transition " +
              (filter === f
                ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground")
            }
          >
            {f === "all" ? "All" : STATUS_LABEL[f as Status]}
            {f !== "all" && counts[f] ? ` · ${counts[f]}` : ""}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
            <Inbox className="size-6" />
            Nothing here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((r) => (
            <RequestCard key={r.id} req={r} onChanged={onChanged} onRemoved={onRemoved} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  req,
  onChanged,
  onRemoved,
}: {
  req: ToolRequestDTO;
  onChanged: (r: ToolRequestDTO) => void;
  onRemoved: (id: string) => void;
}) {
  const [open, setOpen] = useState(req.status === "pending" || req.status === "in_progress");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // editable form state
  const [name, setName] = useState(req.name);
  const [category, setCategory] = useState(req.category);
  const [homepage, setHomepage] = useState(req.homepage);
  const [description, setDescription] = useState(req.description);
  const [correctionNote, setCorrectionNote] = useState(req.correctionNote);
  const [install, setInstall] = useState<InstallDTO[]>(
    req.install.length ? req.install : []
  );

  function fieldsBody() {
    return {
      name,
      category,
      homepage,
      description,
      correctionNote,
      install: install
        .filter((i) => i.packageId.trim())
        .map((i) => ({ manager: i.manager, packageId: i.packageId.trim() })),
    };
  }

  async function patch(extra: Record<string, unknown>, successMsg?: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/catalog/requests/${req.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fieldsBody(), ...extra }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    const d = data.request;
    onChanged({
      ...req,
      name: d.name,
      category: d.category ?? "",
      homepage: d.homepage ?? "",
      description: d.description ?? "",
      correctionNote: d.correctionNote ?? "",
      install: (d.install ?? []).map((i: InstallDTO) => ({
        manager: i.manager,
        packageId: i.packageId,
        command: i.command ?? "",
      })),
      status: d.status,
    });
    if (successMsg) setError(null);
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/catalog/requests/${req.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) onRemoved(req.id);
  }

  const canApprove = !!category.trim() && install.some((i) => i.packageId.trim());

  return (
    <Card>
      <CardContent className="py-4">
        {/* summary row */}
        <div className="flex items-start justify-between gap-4">
          <button onClick={() => setOpen((o) => !o)} className="min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{req.name}</span>
              <Badge variant="outline" className={STATUS_STYLE[req.status]}>
                {STATUS_LABEL[req.status]}
              </Badge>
            </div>
            {req.notes && <p className="mt-1 text-sm text-muted-foreground">“{req.notes}”</p>}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {new Date(req.createdAt).toLocaleDateString()} · {req.requesterName}
              {req.requesterEmail ? ` (${req.requesterEmail})` : ""}
            </p>
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => setOpen((o) => !o)}
              className="rounded-md border border-border p-1.5 text-muted-foreground transition hover:text-foreground"
              title={open ? "Collapse" : "Manage"}
            >
              {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          </div>
        </div>

        {/* editor / workflow */}
        {open && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <LabeledInput label="Name" value={name} onChange={setName} />
              <LabeledInput
                label="Category"
                value={category}
                onChange={setCategory}
                placeholder="e.g. Editors & IDEs"
              />
              <LabeledInput
                label="Homepage"
                value={homepage}
                onChange={setHomepage}
                placeholder="https://…"
              />
              <LabeledInput
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Short summary"
              />
            </div>

            {/* install sources */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Install sources</p>
              <div className="space-y-2">
                {install.map((row, idx) => (
                  <InstallRow
                    key={idx}
                    row={row}
                    onChange={(next) =>
                      setInstall((prev) => prev.map((r, i) => (i === idx ? next : r)))
                    }
                    onRemove={() => setInstall((prev) => prev.filter((_, i) => i !== idx))}
                  />
                ))}
                <button
                  onClick={() =>
                    setInstall((prev) => [...prev, { manager: "winget", packageId: "", command: "" }])
                  }
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  <Plus className="size-3.5" /> Add source
                </button>
              </div>
            </div>

            <LabeledInput
              label="Correction note (shown to requester)"
              value={correctionNote}
              onChange={setCorrectionNote}
              placeholder="What needs fixing…"
            />

            {error && (
              <p className="flex items-center gap-1.5 text-sm text-red-400">
                <CircleAlert className="size-4" /> {error}
              </p>
            )}

            {/* actions */}
            <div className="flex flex-wrap items-center gap-2">
              <ActionBtn onClick={() => patch({})} busy={busy} variant="save">
                Save
              </ActionBtn>
              {req.status === "pending" && (
                <ActionBtn onClick={() => patch({ status: "in_progress" })} busy={busy}>
                  <Play className="size-3.5" /> Start review
                </ActionBtn>
              )}
              <ActionBtn onClick={() => patch({ status: "needs_correction" })} busy={busy} variant="warn">
                <CircleAlert className="size-3.5" /> Needs correction
              </ActionBtn>
              <ActionBtn onClick={() => patch({ status: "verified" })} busy={busy} variant="verify">
                <BadgeCheck className="size-3.5" /> Verified
              </ActionBtn>
              <ActionBtn
                onClick={() => patch({ status: "approved" })}
                busy={busy}
                variant="approve"
                disabled={!canApprove}
                title={canApprove ? "Approve & add to catalog" : "Add a category and install source first"}
              >
                <Check className="size-3.5" /> Approve
              </ActionBtn>
              <ActionBtn onClick={() => patch({ status: "rejected" })} busy={busy} variant="reject">
                <X className="size-3.5" /> Reject
              </ActionBtn>
              <button
                onClick={remove}
                disabled={busy}
                title="Delete request"
                className="ml-auto rounded-md border border-border p-1.5 text-muted-foreground transition hover:bg-muted disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InstallRow({
  row,
  onChange,
  onRemove,
}: {
  row: InstallDTO;
  onChange: (r: InstallDTO) => void;
  onRemove: () => void;
}) {
  const preview = row.packageId.trim() ? buildCommand(row.manager, row.packageId) : "";
  return (
    <div className="flex items-center gap-2">
      <select
        value={row.manager}
        onChange={(e) => onChange({ ...row, manager: e.target.value })}
        className="h-8 rounded-md border border-border bg-transparent px-2 text-xs text-foreground outline-none"
      >
        {INSTALL_MANAGERS.map((m) => (
          <option key={m} value={m} className="bg-background">
            {m}
          </option>
        ))}
      </select>
      <input
        value={row.packageId}
        onChange={(e) => onChange({ ...row, packageId: e.target.value })}
        placeholder="package id (e.g. Neovim.Neovim)"
        className="h-8 flex-1 rounded-md border border-border bg-transparent px-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-amber-400/40"
      />
      {preview && (
        <code className="hidden max-w-[40%] truncate rounded bg-muted px-2 py-1 font-mono text-[0.65rem] text-muted-foreground md:block">
          {preview}
        </code>
      )}
      <button
        onClick={onRemove}
        className="rounded-md border border-border p-1.5 text-muted-foreground transition hover:bg-muted"
        title="Remove source"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-border bg-transparent px-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-amber-400/40"
      />
    </label>
  );
}

const VARIANT: Record<string, string> = {
  save: "border-border text-foreground hover:bg-muted",
  warn: "border-orange-500/30 text-orange-400 hover:bg-orange-500/10",
  verify: "border-violet-500/30 text-violet-400 hover:bg-violet-500/10",
  approve: "border-green-500/30 text-green-400 hover:bg-green-500/10",
  reject: "border-red-500/30 text-red-400 hover:bg-red-500/10",
  default: "border-border text-muted-foreground hover:text-foreground",
};

function ActionBtn({
  onClick,
  busy,
  disabled,
  variant = "default",
  title,
  children,
}: {
  onClick: () => void;
  busy: boolean;
  disabled?: boolean;
  variant?: keyof typeof VARIANT | string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      title={title}
      className={
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-40 " +
        (VARIANT[variant] ?? VARIANT.default)
      }
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}
