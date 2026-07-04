import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { validateApiToken } from "@/lib/api-token";
import { Machine } from "@/models/Machine";
import { Snapshot } from "@/models/Snapshot";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const raw = authHeader.slice(7);
    await connectDB();

    const userId = await validateApiToken(raw);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { machine, environment, packages, vscode, git, lock, profiles, tag } = body;

    if (!machine || !environment || !packages || !vscode || !git || !lock) {
      return NextResponse.json({ error: "Missing snapshot fields" }, { status: 400 });
    }

    // Upsert machine by (userId, hostname)
    const machineDoc = await Machine.findOneAndUpdate(
      { userId, hostname: machine.hostname },
      {
        userId,
        hostname: machine.hostname,
        osName: machine.os_name ?? "Windows",
        osVersion: machine.os_version ?? "",
        username: machine.username ?? "",
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Idempotent upsert by snapshotId
    const snapshot = await Snapshot.findOneAndUpdate(
      { snapshotId: lock.snapshot_id },
      {
        snapshotId: lock.snapshot_id,
        machineId: machineDoc._id,
        userId,
        capturedAt: new Date(machine.captured_at),
        tag: typeof tag === "string" && tag.trim() ? tag.trim() : undefined,
        schemaVersion: lock.schema_version ?? 1,
        machine,
        environment,
        packages,
        vscode,
        git,
        // Optional Asgard profiles summary (CLIs >= 0.8 send it).
        profiles: profiles ?? undefined,
        lockSha256: lock.snapshot_id, // use snapshot_id as integrity ref
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true, snapshotId: snapshot.snapshotId });
  } catch (err) {
    console.error("[ingest]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
