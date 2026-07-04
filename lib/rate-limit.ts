import { NextRequest, NextResponse } from "next/server";
import { RateLimit } from "@/models/RateLimit";
import { connectDB } from "@/lib/db";

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfter: number; // seconds until the current window resets
}

/**
 * Fixed-window limiter backed by a single atomic upsert. All requests that fall
 * in the same `windowSec` bucket share one counter document; the first request
 * in a window creates it, the rest `$inc` it. Fails open on DB errors — a
 * limiter outage must not take down the endpoint it protects.
 *
 * @param bucket      logical endpoint name, e.g. "device-code"
 * @param identifier  what we're limiting on, e.g. an IP or userId
 * @param limit       max requests allowed per window
 * @param windowSec   window length in seconds
 */
export async function checkRateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSec * 1000)) * windowSec * 1000;
  const key = `${bucket}:${identifier}:${windowStart}`;
  const expiresAt = new Date(windowStart + windowSec * 1000);
  const retryAfter = Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000));

  try {
    await connectDB();
    const doc = await RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, new: true }
    ).lean<{ count: number }>();

    const count = doc?.count ?? 1;
    return {
      ok: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      retryAfter,
    };
  } catch (err) {
    // Fail open: never let the limiter itself cause an outage.
    console.error("[rate-limit]", err);
    return { ok: true, limit, remaining: limit, retryAfter };
  }
}

/**
 * Best-effort client IP from proxy headers. Takes the first hop of
 * `x-forwarded-for` (the original client on Vercel and most proxies), falling
 * back to `x-real-ip` and finally a constant so a missing header collapses to a
 * single shared bucket rather than throwing.
 */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Standard 429 response with a `Retry-After` header. */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "rate_limited", retry_after: result.retryAfter },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  );
}
