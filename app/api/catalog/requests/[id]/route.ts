import { NextRequest, NextResponse } from "next/server";
import { isMaintainer } from "@/lib/maintainer";
import { connectDB } from "@/lib/db";
import { ToolRequest } from "@/models/ToolRequest";

const STATUSES = ["pending", "approved", "rejected"] as const;

// PATCH — maintainer sets a request's status.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isMaintainer())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await connectDB();
  const updated = await ToolRequest.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ request: updated });
}

// DELETE — maintainer removes a request.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isMaintainer())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await connectDB();
  await ToolRequest.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
