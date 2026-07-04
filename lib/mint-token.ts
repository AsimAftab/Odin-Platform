import { ApiToken } from "@/models/ApiToken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Mints a new Odin API token for a user and persists only its bcrypt hash.
 * Returns the raw `odin_<keyId>_<secret>` token — this is the ONE time it
 * exists in plaintext, so the caller must hand it straight to the client.
 *
 * The token carries a public 16-hex `keyId` so validation can look the hash up
 * in O(1) (`findOne({ keyId })`) instead of bcrypt-comparing every stored token.
 * The CLI treats the whole string as opaque, so this format change needs no CLI
 * change; older `odin_<hex>` tokens keep working via the legacy scan path.
 *
 * Shared by the dashboard token route (`/api/tokens`) and the CLI device
 * authorization flow (`/api/device/token`) so both mint identical tokens.
 * The caller is responsible for having connected to the DB (`connectDB()`).
 */
export async function mintApiToken(
  userId: string,
  label: string
): Promise<string> {
  const keyId = crypto.randomBytes(8).toString("hex"); // 16 hex chars
  const secret = crypto.randomBytes(32).toString("hex"); // 64 hex chars
  const raw = `odin_${keyId}_${secret}`;
  const tokenHash = await bcrypt.hash(raw, 12);
  await ApiToken.create({ userId, label, tokenHash, keyId });
  return raw;
}
