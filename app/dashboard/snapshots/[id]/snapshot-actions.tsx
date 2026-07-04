"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, GitCompare } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

interface Sibling {
  snapshotId: string;
  capturedAt: string;
  label: string;
}

/**
 * Action bar for a snapshot: export a restore script, delete the snapshot, and
 * pick another snapshot of the same machine to diff against. `siblings` are the
 * machine's other snapshots (newest first), used to populate the compare picker.
 */
export function SnapshotActions({
  snapshotId,
  siblings,
}: {
  snapshotId: string;
  siblings: Sibling[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function del() {
    if (
      !window.confirm(
        "Delete this snapshot? This can't be undone (the CLI keeps its own local copy)."
      )
    )
      return;
    setDeleting(true);
    const res = await fetch(`/api/snapshots/${snapshotId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/dashboard/snapshots");
      router.refresh();
    } else {
      setDeleting(false);
      window.alert("Failed to delete snapshot.");
    }
  }

  function compare(otherId: string) {
    if (!otherId) return;
    // `a` = the older/other snapshot (before), `b` = this one (after).
    router.push(`/dashboard/snapshots/diff?a=${otherId}&b=${snapshotId}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {siblings.length > 0 && (
        <div className="flex items-center gap-1.5">
          <GitCompare className="w-4 h-4 text-muted-foreground" />
          <select
            defaultValue=""
            onChange={(e) => compare(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="" disabled>
              Compare with…
            </option>
            {siblings.map((s) => (
              <option key={s.snapshotId} value={s.snapshotId}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <a
        href={`/api/snapshots/${snapshotId}/export`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Download className="w-4 h-4 mr-1" /> Restore script
      </a>
      <Button
        variant="outline"
        size="sm"
        onClick={del}
        disabled={deleting}
        className="text-muted-foreground hover:text-red-400"
      >
        <Trash2 className="w-4 h-4 mr-1" /> {deleting ? "Deleting…" : "Delete"}
      </Button>
    </div>
  );
}
