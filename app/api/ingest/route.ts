import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { validateApiToken } from "@/lib/api-token";
import { Machine } from "@/models/Machine";
import { Snapshot } from "@/models/Snapshot";
import { UserSettings } from "@/models/UserSettings";
import { ingestSchema, MAX_INGEST_BYTES } from "@/lib/ingest-schema";
import {
  checkRateLimit,
  clientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Pre-auth per-IP limit so an unauthenticated flood can't reach bcrypt.
    const ipLimit = await checkRateLimit("ingest-ip", clientIp(req), 60, 60);
    if (!ipLimit.ok) return rateLimitResponse(ipLimit);

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    // Reject oversized bodies before reading/parsing them.
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_INGEST_BYTES) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413 }
      );
    }

    const raw = authHeader.slice(7);
    await connectDB();

    const userId = await validateApiToken(raw);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Post-auth per-user limit.
    const userLimit = await checkRateLimit("ingest-user", userId, 30, 60);
    if (!userLimit.ok) return rateLimitResponse(userLimit);

    // Read the raw text so we can both enforce the size cap (defends against a
    // missing/forged content-length) and hash the exact bytes.
    const text = await req.text();
    if (text.length > MAX_INGEST_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = ingestSchema.safeParse(json);
    if (!parsed.success) {
      // Return the field paths that failed, never the payload itself.
      const issues = parsed.error.issues
        .slice(0, 10)
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
      return NextResponse.json(
        { error: "Invalid snapshot payload", issues },
        { status: 400 }
      );
    }

    const { machine, environment, packages, vscode, git, lock, profiles, tag } =
      parsed.data;

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

    // Real content-integrity digest over the captured sections (stable field
    // order matching the destructure above), replacing the old placeholder that
    // stored snapshot_id.
    const lockSha256 = crypto
      .createHash("sha256")
      .update(JSON.stringify({ machine, environment, packages, vscode, git }))
      .digest("hex");

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
        lockSha256,
      },
      { upsert: true, new: true }
    );

    // Opportunistic retention: if the user set a per-machine cap, prune the
    // oldest snapshots for this machine beyond that count. Best-effort — never
    // fail the ingest over cleanup.
    try {
      const settings = await UserSettings.findOne({ userId })
        .select("retentionPerMachine")
        .lean<{ retentionPerMachine?: number } | null>();
      const keep = settings?.retentionPerMachine ?? 0;
      if (keep > 0) {
        const survivors = await Snapshot.find({ machineId: machineDoc._id })
          .sort({ capturedAt: -1 })
          .skip(keep)
          .select("_id")
          .lean();
        if (survivors.length > 0) {
          await Snapshot.deleteMany({
            _id: { $in: survivors.map((s) => s._id) },
          });
        }
      }
    } catch (retentionErr) {
      console.error("[ingest] retention", retentionErr);
    }

    return NextResponse.json({ ok: true, snapshotId: snapshot.snapshotId });
  } catch (err) {
    console.error("[ingest]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
