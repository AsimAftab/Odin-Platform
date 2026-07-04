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
 * - Keyed tokens (`odin_<keyId>_<secret>`) resolve in O(1): look the single
 *   candidate up by `keyId`, then one bcrypt compare.
 * - Legacy tokens (`odin_<hex>`) fall back to scanning the hashes that predate
 *   the keyId column (`keyId: { $exists: false }`), so old tokens keep working
 *   without a migration. This cost shrinks as users rotate to keyed tokens.
 *
 * This is independent of the web session auth (Better Auth) — it authenticates
 * the Odin CLI hitting /api/ingest.
 */
export async function validateApiToken(raw: string): Promise<string | null> {
  await connectDB();

  const keyId = parseTokenKeyId(raw);

  if (keyId) {
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

  // Legacy fallback: only scan pre-keyId tokens.
  const tokens = await ApiToken.find({ keyId: { $exists: false } }).lean();
  for (const t of tokens) {
    const match = await bcrypt.compare(raw, t.tokenHash);
    if (match) {
      await ApiToken.updateOne({ _id: t._id }, { lastUsedAt: new Date() });
      return t.userId;
    }
  }
  return null;
}
