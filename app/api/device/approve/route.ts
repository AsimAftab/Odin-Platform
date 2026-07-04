import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { DeviceCode } from "@/models/DeviceCode";
import { normalizeUserCode } from "@/lib/user-code";

// OAuth 2.0 Device Authorization Grant (RFC 8628) — step 2. Called from the
// /activate page by the signed-in user to approve or deny a pending device.
// Session-guarded: the approval binds the (future) token to this user.

export async function POST(req: NextRequest) {
  const { userId, user } = await getSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const rawCode = typeof body?.user_code === "string" ? body.user_code : "";
  const decision = body?.decision === "deny" ? "deny" : "approve";
  if (!rawCode.trim()) {
    return NextResponse.json({ error: "user_code is required" }, { status: 400 });
  }
  const userCode = normalizeUserCode(rawCode);

  await connectDB();
  const record = await DeviceCode.findOne({ userCode });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (record.status !== "pending") {
    return NextResponse.json(
      { error: "already_resolved", status: record.status },
      { status: 409 }
    );
  }

  record.status = decision === "deny" ? "denied" : "approved";
  if (decision === "approve") {
    record.userId = userId;
    record.userEmail = user?.email ?? undefined;
  }
  await record.save();

  return NextResponse.json({
    ok: true,
    status: record.status,
    label: record.label ?? null,
  });
}
