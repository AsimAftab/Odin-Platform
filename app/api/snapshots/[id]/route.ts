import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { validateApiToken } from "@/lib/api-token";
import { Snapshot } from "@/models/Snapshot";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";

// Resolves the caller's userId from either auth path, and reports which one it
// was: a Bearer API token (the Odin CLI, e.g. `odin restore <snapshot-id>`
// pulling a platform-hosted snapshot) or a Better Auth session (the
// dashboard). Bearer is checked first since it's cheap to rule out (a
// missing/malformed header) before the DB call a session lookup requires.
async function resolveUserId(
  req: NextRequest
): Promise<{ userId: string | null; viaToken: boolean }> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const userId = await validateApiToken(authHeader.slice(7));
    return { userId, viaToken: true };
  }
  const { userId } = await getSession();
  return { userId, viaToken: false };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, viaToken } = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only throttle CLI (token) traffic — dashboard browsing shouldn't be capped.
  if (viaToken) {
    const limit = await checkRateLimit("snapshot-get", `${userId}:${clientIp(req)}`, 60, 60);
    if (!limit.ok) return rateLimitResponse(limit);
  }

  await connectDB();
  const { id } = await params;
  const snapshot = await Snapshot.findOne({ snapshotId: id, userId }).lean();

  if (!snapshot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ snapshot });
}

// DELETE /api/snapshots/<id> — remove a single snapshot the caller owns.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await getSession();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const result = await Snapshot.deleteOne({ snapshotId: id, userId });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
