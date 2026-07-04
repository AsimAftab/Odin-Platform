import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";
import { buildRestoreScript } from "@/lib/restore-script";

// GET /api/snapshots/<id>/export -> PowerShell restore script (attachment).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await getSession();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const snapshot = await Snapshot.findOne({ snapshotId: id, userId }).lean();
  if (!snapshot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const script = buildRestoreScript(snapshot);
  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="odin-restore-${id.slice(0, 8)}.ps1"`,
    },
  });
}
