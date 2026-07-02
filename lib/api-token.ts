import { ApiToken } from "@/models/ApiToken";
import { connectDB } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * Validates a raw Bearer token from CLI requests and returns the owning userId.
 * Tokens are stored only as bcrypt hashes, so this scans and compares. This is
 * independent of the web session auth (Better Auth) — it authenticates the
 * Odin CLI hitting /api/ingest.
 */
export async function validateApiToken(raw: string): Promise<string | null> {
  await connectDB();
  const tokens = await ApiToken.find({ userId: { $exists: true } }).lean();
  for (const t of tokens) {
    const match = await bcrypt.compare(raw, t.tokenHash);
    if (match) {
      await ApiToken.updateOne({ _id: t._id }, { lastUsedAt: new Date() });
      return t.userId;
    }
  }
  return null;
}
