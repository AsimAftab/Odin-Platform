import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";

export async function GET(req: NextRequest) {
  const { userId } = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const machineId = searchParams.get("machineId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const query: Record<string, unknown> = { userId };
  if (machineId) query.machineId = machineId;

  const snapshots = await Snapshot.find(query)
    .select("snapshotId machineId capturedAt tag schemaVersion lockSha256 createdAt")
    .sort({ capturedAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ snapshots });
}
