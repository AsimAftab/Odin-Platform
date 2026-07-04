// Secret detection + masking for values surfaced in the dashboard (Config
// Vault). This MIRRORS the CLI's `src/services/redact.rs` in Project-Odin — keep
// the keyword and value-pattern lists aligned across both repos. The CLI redacts
// before upload; this is a second, UI-side layer so anything that slipped
// through (or predates CLI redaction) is masked by default in the browser.

// Case-insensitive substrings that mark an env var NAME as secret-bearing.
const SECRET_NAME_KEYWORDS = [
  "TOKEN",
  "SECRET",
  "PASSWORD",
  "PASSWD",
  "PWD",
  "APIKEY",
  "API_KEY",
  "CREDENTIAL",
  "PRIVATE_KEY",
  "ACCESS_KEY",
  "AUTH",
  "PAT",
];

// Value shapes that look like credentials regardless of the variable name.
const SECRET_VALUE_PATTERNS: RegExp[] = [
  /gh[pousr]_[A-Za-z0-9]{20,}/, // GitHub PAT / OAuth / server / refresh
  /github_pat_[A-Za-z0-9_]{20,}/, // GitHub fine-grained PAT
  /\bsk-[A-Za-z0-9_-]{16,}/, // OpenAI / Anthropic-style secret key
  /\bAKIA[0-9A-Z]{16}\b/, // AWS access key id
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/, // Slack token
  /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}/, // JWT
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/, // PEM private key
];

/** True if a variable name or value looks secret-bearing. */
export function isSecret(name: string, value: string): boolean {
  const upperName = name.toUpperCase();
  if (SECRET_NAME_KEYWORDS.some((k) => upperName.includes(k))) return true;
  return SECRET_VALUE_PATTERNS.some((re) => re.test(value));
}

/**
 * Middle-mask a value: keep a few leading/trailing chars for recognizability,
 * hide the rest. Short values are fully masked.
 */
export function maskValue(value: string): string {
  if (!value) return value;
  if (value.length <= 8) return "•".repeat(Math.max(4, value.length));
  return `${value.slice(0, 3)}${"•".repeat(6)}${value.slice(-3)}`;
}
