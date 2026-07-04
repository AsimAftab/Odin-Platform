"use client";

import { useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";

/**
 * One-click "request this tool" button for packages that aren't in the catalog
 * yet. Sends a structured request prefilled from the user's snapshot (name,
 * manager, packageId, version) so maintainers start from real data.
 */
export function RequestToolButton({
  name,
  manager,
  packageId,
  version,
  alreadyRequested,
}: {
  name: string;
  manager: string;
  packageId: string;
  version?: string;
  alreadyRequested: boolean;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    alreadyRequested ? "done" : "idle"
  );

  async function request() {
    setState("loading");
    try {
      const res = await fetch("/api/catalog/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          manager,
          packageId,
          version,
          notes: "Requested from snapshot coverage",
        }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-400">
        <Check className="w-3 h-3" /> requested
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={request}
      disabled={state === "loading"}
      className="inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/5 px-2 py-0.5 text-xs text-amber-400 transition hover:bg-amber-400/15 disabled:opacity-60"
      title={`Request ${name} for the catalog`}
    >
      {state === "loading" ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Plus className="w-3 h-3" />
      )}
      {state === "error" ? "retry" : "request"}
    </button>
  );
}
