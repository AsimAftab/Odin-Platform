import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Machine } from "@/models/Machine";

export async function GET() {
  const { userId } = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const machines = await Machine.find({ userId }).sort({ lastSeenAt: -1 }).lean();
  return NextResponse.json({ machines });
}
