// Shared badge color classes so package sources and request statuses look the
// same on every page (tools, requests, health). Brand accent is amber.

/** Package-manager source badges (keys = CLI's lowercase source enum). */
export const SOURCE_COLORS: Record<string, string> = {
  winget: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  chocolatey: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  scoop: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  npm: "bg-red-500/10 text-red-400 border-red-500/20",
  pip: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  cargo: "bg-orange-600/10 text-orange-300 border-orange-600/20",
  manual: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  unknown: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

/** Tool-request workflow status badges. */
export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  needs_correction: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  verified: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

/** Health finding severity badges. */
export const SEVERITY_COLORS: Record<string, string> = {
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  info: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};
