import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { UserSettings } from "@/models/UserSettings";

// GET — current user's settings (creates defaults on first read).
export async function GET() {
  const { userId } = await getSession();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const settings = await UserSettings.findOne({ userId })
    .select("retentionPerMachine")
    .lean<{ retentionPerMachine?: number } | null>();
  return NextResponse.json({
    retentionPerMachine: settings?.retentionPerMachine ?? 0,
  });
}

// PATCH — update settings. Currently just retentionPerMachine (0 = unlimited).
export async function PATCH(req: NextRequest) {
  const { userId } = await getSession();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const raw = Number(body?.retentionPerMachine);
  if (!Number.isFinite(raw) || raw < 0 || raw > 1000) {
    return NextResponse.json(
      { error: "retentionPerMachine must be between 0 and 1000" },
      { status: 400 }
    );
  }
  const retentionPerMachine = Math.floor(raw);

  await connectDB();
  await UserSettings.findOneAndUpdate(
    { userId },
    { retentionPerMachine },
    { upsert: true }
  );
  return NextResponse.json({ retentionPerMachine });
}
