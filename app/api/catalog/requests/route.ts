import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { ToolRequest } from "@/models/ToolRequest";

// GET — the current user's own tool requests.
export async function GET() {
  const { userId } = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const requests = await ToolRequest.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ requests });
}

// POST — request a tool that's missing from the catalog (requires sign-in).
export async function POST(req: NextRequest) {
  const { userId } = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, notes } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Tool name is required" }, { status: 400 });
  }

  await connectDB();

  // Avoid duplicate pending requests from the same user for the same tool.
  const existing = await ToolRequest.findOne({
    userId,
    name: name.trim(),
    status: "pending",
  });
  if (existing) {
    return NextResponse.json({ request: existing, duplicate: true });
  }

  const request = await ToolRequest.create({
    name: name.trim(),
    notes: typeof notes === "string" ? notes.trim() : undefined,
    userId,
  });

  return NextResponse.json({ request });
}
