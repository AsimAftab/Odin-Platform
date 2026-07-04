import { ApiToken } from "@/models/ApiToken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Mints a new Odin API token for a user and persists only its bcrypt hash.
 * Returns the raw `odin_<hex>` token — this is the ONE time it exists in
 * plaintext, so the caller must hand it straight to the client.
 *
 * Shared by the dashboard token route (`/api/tokens`) and the CLI device
 * authorization flow (`/api/device/token`) so both mint identical tokens.
 * The caller is responsible for having connected to the DB (`connectDB()`).
 */
export async function mintApiToken(
  userId: string,
  label: string
): Promise<string> {
  const raw = `odin_${crypto.randomBytes(32).toString("hex")}`;
  const tokenHash = await bcrypt.hash(raw, 12);
  await ApiToken.create({ userId, label, tokenHash });
  return raw;
}
