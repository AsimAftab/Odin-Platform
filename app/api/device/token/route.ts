import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DeviceCode } from "@/models/DeviceCode";
import { mintApiToken } from "@/lib/mint-token";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";

// OAuth 2.0 Device Authorization Grant (RFC 8628) — step 3. The CLI polls this
// (unauthenticated, it holds the device_code secret) until the user approves.
// Non-terminal errors (`authorization_pending`, `slow_down`) tell the CLI to
// keep polling; terminal errors (`expired_token`, `access_denied`,
// `invalid_grant`) tell it to stop.
export async function POST(req: NextRequest) {
  try {
    // Cap poll volume per IP as a backstop; per-device_code pacing is enforced
    // below via the RFC 8628 `interval` (slow_down).
    const ipLimit = await checkRateLimit("device-token-ip", clientIp(req), 120, 60);
    if (!ipLimit.ok) return rateLimitResponse(ipLimit);

    await connectDB();

    const body = await req.json().catch(() => ({}));
    const deviceCode =
      typeof body?.device_code === "string" ? body.device_code : null;
    if (!deviceCode) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const record = await DeviceCode.findOne({ deviceCode });
    if (!record || record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "expired_token" }, { status: 400 });
    }

    // Enforce the minimum poll interval (RFC 8628 slow_down).
    const now = Date.now();
    if (
      record.lastPolledAt &&
      now - record.lastPolledAt.getTime() < record.interval * 1000
    ) {
      record.lastPolledAt = new Date(now);
      await record.save();
      return NextResponse.json({ error: "slow_down" }, { status: 400 });
    }
    record.lastPolledAt = new Date(now);

    if (record.status === "pending") {
      await record.save();
      return NextResponse.json(
        { error: "authorization_pending" },
        { status: 400 }
      );
    }

    if (record.status === "denied") {
      await record.save();
      return NextResponse.json({ error: "access_denied" }, { status: 400 });
    }

    // status === "approved": atomically claim the single token issuance so two
    // concurrent polls can never mint two tokens.
    const claimed = await DeviceCode.findOneAndUpdate(
      { deviceCode, status: "approved", tokenIssued: false },
      { $set: { tokenIssued: true, lastPolledAt: new Date(now) } },
      { new: true }
    );
    if (!claimed || !claimed.userId) {
      // Already issued (device_code is single-use) or lost the race.
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    }

    const accessToken = await mintApiToken(
      claimed.userId,
      claimed.label || "odin-cli"
    );

    return NextResponse.json({
      access_token: accessToken,
      token_type: "Bearer",
      account: { email: claimed.userEmail ?? null },
    });
  } catch (err) {
    console.error("[device/token]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
