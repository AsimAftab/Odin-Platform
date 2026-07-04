import { ApiToken } from "@/models/ApiToken";
import { connectDB } from "@/lib/db";
import { parseTokenKeyId } from "@/lib/token-format";
import bcrypt from "bcryptjs";

// Re-exported for callers that already import it from here.
export { parseTokenKeyId };

/**
 * Validates a raw Bearer token from CLI requests and returns the owning userId.
 * Tokens are stored only as bcrypt hashes.
 *
 * Only the keyed format (`odin_<keyId>_<secret>`) is accepted: look the single
 * candidate up by its public `keyId` in O(1), then one bcrypt compare. Anything
 * not in that shape is rejected.
 *
 * This is independent of the web session auth (Better Auth) — it authenticates
 * the Odin CLI hitting /api/ingest.
 */
export async function validateApiToken(raw: string): Promise<string | null> {
  const keyId = parseTokenKeyId(raw);
  if (!keyId) return null;

  await connectDB();
  const token = await ApiToken.findOne({ keyId }).lean<{
    _id: unknown;
    userId: string;
    tokenHash: string;
  } | null>();
  if (!token) return null;

  const match = await bcrypt.compare(raw, token.tokenHash);
  if (!match) return null;

  await ApiToken.updateOne({ _id: token._id }, { lastUsedAt: new Date() });
  return token.userId;
}
