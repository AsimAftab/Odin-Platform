import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DeviceCode } from "@/models/DeviceCode";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import crypto from "crypto";

// OAuth 2.0 Device Authorization Grant (RFC 8628) — step 1. The Odin CLI calls
// this (unauthenticated) to obtain a device_code + user_code pair. The user
// then approves the user_code in the browser at /activate, and the CLI polls
// POST /api/device/token until an access token is issued.

const EXPIRES_IN = 600; // device code lifetime, seconds (10 min)
const INTERVAL = 5; // minimum seconds between CLI polls

// Unambiguous alphabet (no 0/O/1/I) for the user-typed code.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateUserCode(): string {
  const bytes = crypto.randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
    if (i === 3) out += "-";
  }
  return out; // e.g. WXYZ-2345
}

export async function POST(req: NextRequest) {
  try {
    // Public endpoint that creates DB records — throttle per IP.
    const limit = await checkRateLimit("device-code", clientIp(req), 10, 60);
    if (!limit.ok) return rateLimitResponse(limit);

    await connectDB();

    const body = await req.json().catch(() => ({}));
    const label =
      typeof body?.label === "string" ? body.label.slice(0, 120) : undefined;

    const deviceCode = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + EXPIRES_IN * 1000);

    // Retry on the (extremely unlikely) user_code collision.
    let userCode = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      userCode = generateUserCode();
      try {
        await DeviceCode.create({
          deviceCode,
          userCode,
          label,
          status: "pending",
          tokenIssued: false,
          interval: INTERVAL,
          expiresAt,
        });
        break;
      } catch (e: unknown) {
        const dup = (e as { code?: number })?.code === 11000;
        if (dup && attempt < 4) continue;
        throw e;
      }
    }

    const base = process.env.BETTER_AUTH_URL ?? new URL(req.url).origin;
    const verificationUri = `${base}/activate`;

    return NextResponse.json({
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: verificationUri,
      verification_uri_complete: `${verificationUri}?code=${userCode}`,
      expires_in: EXPIRES_IN,
      interval: INTERVAL,
    });
  } catch (err) {
    logger.error("device.code", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
