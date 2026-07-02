"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2, Clock, Loader2, Inbox } from "lucide-react";

export interface ToolRequestDTO {
  id: string;
  name: string;
  notes: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  requesterName: string;
  requesterEmail: string;
}

const STATUS_STYLE: Record<ToolRequestDTO["status"], string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const FILTERS = ["pending", "approved", "rejected", "all"] as const;
type Filter = (typeof FILTERS)[number];

export function RequestsClient({
  initialRequests,
}: {
  initialRequests: ToolRequestDTO[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const counts = requests.reduce(
    (acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc),
    {} as Record<string, number>
  );

  const visible = requests.filter((r) => filter === "all" || r.status === filter);

  async function setStatus(id: string, status: ToolRequestDTO["status"]) {
    setBusy(id);
    const res = await fetch(`/api/catalog/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (res.ok) {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
  }

  async function remove(id: string) {
    setBusy(id);
    const res = await fetch(`/api/catalog/requests/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "rounded-full border px-3 py-1 text-xs font-medium capitalize transition " +
              (filter === f
                ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground")
            }
          >
            {f}
            {f !== "all" && counts[f] ? ` · ${counts[f]}` : ""}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
            <Inbox className="size-6" />
            No {filter === "all" ? "" : filter} requests.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{r.name}</span>
                    <Badge variant="outline" className={STATUS_STYLE[r.status]}>
                      {r.status}
                    </Badge>
                  </div>
                  {r.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">{r.notes}</p>
                  )}
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {new Date(r.createdAt).toLocaleDateString()} ·{" "}
                    {r.requesterName}
                    {r.requesterEmail ? ` (${r.requesterEmail})` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {busy === r.id ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      {r.status !== "approved" && (
                        <IconBtn
                          title="Approve"
                          onClick={() => setStatus(r.id, "approved")}
                          className="text-green-400 hover:bg-green-500/10"
                        >
                          <Check className="size-4" />
                        </IconBtn>
                      )}
                      {r.status !== "rejected" && (
                        <IconBtn
                          title="Reject"
                          onClick={() => setStatus(r.id, "rejected")}
                          className="text-red-400 hover:bg-red-500/10"
                        >
                          <X className="size-4" />
                        </IconBtn>
                      )}
                      <IconBtn
                        title="Delete"
                        onClick={() => remove(r.id)}
                        className="text-muted-foreground hover:bg-muted"
                      >
                        <Trash2 className="size-4" />
                      </IconBtn>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  className,
  children,
}: {
  title: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={"rounded-md border border-border p-1.5 transition " + (className ?? "")}
    >
      {children}
    </button>
  );
}
