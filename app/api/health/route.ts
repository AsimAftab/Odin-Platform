import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

// Liveness/readiness probe for self-hosted deploys (Docker HEALTHCHECK,
// load balancers, uptime monitors). Public and unauthenticated — it exposes
// only up/down state, never data. Distinct from the /dashboard/health page,
// which is a per-user snapshot diagnostic.
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await connectDB();
    await mongoose.connection.db?.admin().ping();
    return NextResponse.json({
      status: "ok",
      db: "up",
      dbLatencyMs: Date.now() - startedAt,
      uptimeSec: Math.floor(process.uptime()),
    });
  } catch {
    return NextResponse.json(
      { status: "degraded", db: "down" },
      { status: 503 }
    );
  }
}
