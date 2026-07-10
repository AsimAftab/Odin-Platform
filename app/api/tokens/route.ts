import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { ApiToken } from "@/models/ApiToken";
import { mintApiToken } from "@/lib/mint-token";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

// GET — list tokens for current user
export async function GET() {
  const { userId } = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const tokens = await ApiToken.find({ userId }).select("-tokenHash").lean();
  return NextResponse.json({ tokens });
}

// POST — generate a new token
export async function POST(req: NextRequest) {
  const { userId } = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Minting is bcrypt-bound and creates DB rows — cap per user.
  const limit = await checkRateLimit("token-mint", userId, 10, 3600);
  if (!limit.ok) return rateLimitResponse(limit);

  const { label } = await req.json();
  if (!label) return NextResponse.json({ error: "label is required" }, { status: 400 });

  await connectDB();

  // Return raw token once — never stored in plaintext
  const raw = await mintApiToken(userId, label);
  return NextResponse.json({ token: raw, label });
}

// DELETE — revoke a token by id
export async function DELETE(req: NextRequest) {
  const { userId } = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await connectDB();
  await ApiToken.deleteOne({ _id: id, userId });
  return NextResponse.json({ ok: true });
}
