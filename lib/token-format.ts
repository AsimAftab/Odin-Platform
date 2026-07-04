// Pure helpers for the Odin API token format, with no DB or env dependency so
// they're trivially unit-testable. The keyed format is `odin_<keyId>_<secret>`
// where keyId is 16 hex chars and secret is 64 hex chars (see lib/mint-token.ts).
// Legacy tokens are `odin_<64-hex>` with no keyId segment.

const KEYED_TOKEN_RE = /^odin_([0-9a-f]{16})_[0-9a-f]{64}$/;

/**
 * Extracts the public `keyId` from a raw token, or null if the token isn't in
 * the keyed format (legacy or malformed).
 */
export function parseTokenKeyId(raw: string): string | null {
  const match = KEYED_TOKEN_RE.exec(raw);
  return match ? match[1] : null;
}
