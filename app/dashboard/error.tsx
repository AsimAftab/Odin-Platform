"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Error boundary for the dashboard segment. Catches thrown errors from the
// server components (e.g. a transient DB failure) instead of crashing the app.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="w-10 h-10 text-amber-400 mb-4" />
      <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        We couldn&apos;t load this page. This is usually temporary — try again in
        a moment.
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
