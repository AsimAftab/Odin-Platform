import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { diffSnapshots } from "@/lib/snapshot-diff";

// GET /api/snapshots/diff?a=<snapshotId>&b=<snapshotId>
// Both snapshots must belong to the caller. `a` is the "before", `b` the "after".
export async function GET(req: NextRequest) {
  const { userId } = await getSession();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const a = searchParams.get("a");
  const b = searchParams.get("b");
  if (!a || !b) {
    return NextResponse.json(
      { error: "Both ?a and ?b snapshot ids are required" },
      { status: 400 }
    );
  }

  await connectDB();
  const [snapA, snapB] = await Promise.all([
    Snapshot.findOne({ snapshotId: a, userId }).lean(),
    Snapshot.findOne({ snapshotId: b, userId }).lean(),
  ]);
  if (!snapA || !snapB) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const diff = diffSnapshots(snapA, snapB);
  return NextResponse.json({ diff });
}
