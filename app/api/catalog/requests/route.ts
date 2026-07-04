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
// Accepts free-text `{name, notes}` or the structured form the dashboard's
// snapshot-coverage view sends: `{name, manager, packageId, version, notes}`.
// Structured fields land in `install[]` so maintainers start from real data.
export async function POST(req: NextRequest) {
  const { userId } = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, notes, manager, packageId, version } = await req.json();
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

  const install =
    typeof manager === "string" &&
    manager.trim() &&
    typeof packageId === "string" &&
    packageId.trim()
      ? [{ manager: manager.trim().toLowerCase(), packageId: packageId.trim() }]
      : [];

  const noteParts = [
    typeof notes === "string" && notes.trim() ? notes.trim() : null,
    typeof version === "string" && version.trim()
      ? `Installed version: ${version.trim()}`
      : null,
  ].filter(Boolean);

  const request = await ToolRequest.create({
    name: name.trim(),
    notes: noteParts.length ? noteParts.join(" · ") : undefined,
    install,
    userId,
  });

  return NextResponse.json({ request });
}
