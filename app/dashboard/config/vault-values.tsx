"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSecret, maskValue } from "@/lib/redact";

interface EnvVar {
  name: string;
  value: string;
}

/**
 * Renders user env vars with secret-bearing values masked by default. Each row
 * with a masked value gets an eye toggle; a "reveal all" control (with a confirm
 * step) flips every masked row at once. Values that don't look secret render in
 * clear — only flagged ones are hidden.
 */
export function EnvVarList({ vars }: { vars: EnvVar[] }) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const secretCount = vars.filter((v) => isSecret(v.name, v.value)).length;

  function toggle(name: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function revealAll() {
    if (
      !window.confirm(
        `Reveal ${secretCount} masked value${secretCount === 1 ? "" : "s"}? ` +
          "These may contain API keys or tokens — make sure no one is watching your screen."
      )
    )
      return;
    setRevealed(new Set(vars.map((v) => v.name)));
  }

  return (
    <div className="space-y-2">
      {secretCount > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-amber-400/80">
            <ShieldAlert className="w-3.5 h-3.5" />
            {secretCount} value{secretCount === 1 ? "" : "s"} masked
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs"
            onClick={revealAll}
          >
            Reveal all
          </Button>
        </div>
      )}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {vars.map((v) => {
          const secret = isSecret(v.name, v.value);
          const show = !secret || revealed.has(v.name);
          return (
            <div
              key={v.name}
              className="flex items-center gap-3 py-1.5 border-b border-border/40 text-sm"
            >
              <span className="font-mono text-xs text-muted-foreground w-40 shrink-0">
                {v.name}
              </span>
              <span className="font-mono text-xs truncate text-foreground/70 flex-1">
                {show ? v.value : maskValue(v.value)}
              </span>
              {secret && (
                <button
                  type="button"
                  onClick={() => toggle(v.name)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label={show ? "Hide value" : "Reveal value"}
                >
                  {show ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * PowerShell profile content is hidden behind a reveal gate — profiles commonly
 * contain inline secrets (e.g. `$env:GH_TOKEN = "…"`), so we don't render them
 * on load.
 */
export function RevealableText({ content }: { content: string }) {
  const [shown, setShown] = useState(false);
  const lineCount = content ? content.split("\n").length : 0;

  if (!shown) {
    return (
      <div className="flex items-center justify-between bg-muted rounded-md p-3">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <EyeOff className="w-3.5 h-3.5" />
          {lineCount} line{lineCount === 1 ? "" : "s"} hidden — may contain secrets
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-xs"
          onClick={() => setShown(true)}
        >
          <Eye className="w-3.5 h-3.5 mr-1" /> Reveal
        </Button>
      </div>
    );
  }

  return (
    <pre className="text-xs font-mono bg-muted rounded-md p-3 overflow-x-auto max-h-64 whitespace-pre-wrap">
      {content || "(empty profile)"}
    </pre>
  );
}
