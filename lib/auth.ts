import { auth, currentUser } from "@clerk/nextjs/server";
import { ApiToken } from "@/models/ApiToken";
import { connectDB } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

// Validates a raw Bearer token from CLI requests, returns userId
export async function validateApiToken(
  raw: string
): Promise<string | null> {
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
