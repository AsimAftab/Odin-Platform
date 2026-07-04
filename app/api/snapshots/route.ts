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
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "25") || 25, 1),
    50
  );
  const page = Math.max(parseInt(searchParams.get("page") ?? "1") || 1, 1);

  const query: Record<string, unknown> = { userId };
  if (machineId) query.machineId = machineId;

  const [items, total] = await Promise.all([
    Snapshot.find(query)
      .select(
        "snapshotId machineId capturedAt tag schemaVersion lockSha256 createdAt"
      )
      .sort({ capturedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Snapshot.countDocuments(query),
  ]);

  return NextResponse.json({ items, total, page, limit });
}
