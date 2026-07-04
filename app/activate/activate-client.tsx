"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Monitor, ShieldCheck, X } from "lucide-react";

type Phase = "form" | "approved" | "denied";

const ERROR_MESSAGES: Record<string, string> = {
  not_found: "That code is invalid or has expired. Start over in your terminal.",
  already_resolved: "This device request was already handled.",
  Unauthorized: "Your session expired. Please sign in again.",
};

export function ActivateClient({
  initialCode,
  label,
  initialStatus,
}: {
  initialCode: string;
  label: string | null;
  initialStatus: string | null;
}) {
  const resolved =
    initialStatus === "approved"
      ? "approved"
      : initialStatus === "denied"
        ? "denied"
        : null;

  const [code, setCode] = useState(initialCode);
  const [phase, setPhase] = useState<Phase>(resolved ?? "form");
  const [loading, setLoading] = useState<null | "approve" | "deny">(null);
  const [error, setError] = useState<string | null>(
    initialStatus === "not_found" ? ERROR_MESSAGES.not_found : null
  );

  async function submit(decision: "approve" | "deny") {
    if (!code.trim()) {
      setError("Enter the code shown in your terminal.");
      return;
    }
    setLoading(decision);
    setError(null);
    try {
      const res = await fetch("/api/device/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_code: code, decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(ERROR_MESSAGES[data?.error] ?? "Could not complete the request.");
        return;
      }
      setPhase(data.status === "denied" ? "denied" : "approved");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-5 text-neutral-200">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(251,191,36,0.10),transparent_70%)]" />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-base font-bold text-amber-400">
            ᚢ
          </span>
          <span className="text-[0.95rem] font-semibold tracking-tight text-white">
            Odin
          </span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl shadow-black/40">
          {phase === "approved" ? (
            <Resolved
              icon={<Check className="size-6 text-emerald-400" />}
              title="Device connected"
              body="You can return to your terminal — Odin is now linked to your account."
            />
          ) : phase === "denied" ? (
            <Resolved
              icon={<X className="size-6 text-red-400" />}
              title="Request denied"
              body="No device was connected. You can close this page."
            />
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <ShieldCheck className="size-4 text-amber-400" />
                </span>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight text-white">
                    Connect a device
                  </h1>
                  <p className="text-xs text-neutral-400">
                    Confirm the code shown in your terminal.
                  </p>
                </div>
              </div>

              {label && (
                <div className="mt-5 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <Monitor className="size-4 text-neutral-400" />
                  <span className="text-sm text-neutral-200">{label}</span>
                  <span className="ml-auto text-[0.7rem] uppercase tracking-wide text-neutral-500">
                    device
                  </span>
                </div>
              )}

              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Verification code
                </span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="WXYZ-2345"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-center font-mono text-lg tracking-[0.3em] text-white uppercase outline-none transition placeholder:tracking-normal placeholder:text-neutral-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                />
              </label>

              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => submit("approve")}
                  disabled={loading !== null}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-amber-400 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300 disabled:opacity-60"
                >
                  {loading === "approve" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Approve device
                  {loading !== "approve" && <ArrowRight className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => submit("deny")}
                  disabled={loading !== null}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent text-sm font-medium text-neutral-300 transition hover:bg-white/5 disabled:opacity-60"
                >
                  {loading === "deny" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Deny
                </button>
              </div>

              <p className="mt-5 text-center text-xs text-neutral-500">
                Only approve a device you started connecting yourself.
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-neutral-400">
          <Link href="/dashboard" className="font-medium text-amber-400 hover:text-amber-300">
            Go to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}

function Resolved({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
        {icon}
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-tight text-white">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-neutral-400">{body}</p>
    </div>
  );
}
