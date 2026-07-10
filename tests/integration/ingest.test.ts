import { describe, expect, test, beforeAll } from "bun:test";
import { jsonRequest, ingestPayload } from "./setup";

// Route modules are loaded dynamically AFTER setup.ts has pointed
// MONGODB_URI at the in-memory mongod (lib/db reads it at import time).
let ingestPOST: (req: import("next/server").NextRequest) => Promise<Response>;
let mintApiToken: (userId: string, label: string) => Promise<string>;
let Snapshot: typeof import("@/models/Snapshot").Snapshot;

let token: string;
const USER = "user-ingest";
// Distinct per-file IP so the shared fixed-window IP buckets never collide
// across test files.
const IP = "10.1.0.1";

beforeAll(async () => {
  const { connectDB } = await import("@/lib/db");
  await connectDB();
  ({ POST: ingestPOST } = await import("@/app/api/ingest/route"));
  ({ mintApiToken } = await import("@/lib/mint-token"));
  ({ Snapshot } = await import("@/models/Snapshot"));
  token = await mintApiToken(USER, "integration");
});

function ingest(body: unknown, headers: Record<string, string> = {}) {
  return ingestPOST(
    jsonRequest("http://localhost/api/ingest", body, {
      "x-forwarded-for": IP,
      authorization: `Bearer ${token}`,
      ...headers,
    })
  );
}

describe("POST /api/ingest", () => {
  test("rejects a missing bearer token with 401", async () => {
    const res = await ingestPOST(
      jsonRequest("http://localhost/api/ingest", ingestPayload("s-noauth"), {
        "x-forwarded-for": IP,
      })
    );
    expect(res.status).toBe(401);
  });

  test("rejects an invalid bearer token with 401", async () => {
    const res = await ingest(ingestPayload("s-badauth"), {
      authorization: "Bearer odin_0123456789abcdef_deadbeef",
    });
    expect(res.status).toBe(401);
  });

  test("rejects a malformed payload with 400 and field paths only", async () => {
    const res = await ingest({ machine: { hostname: "" }, lock: {} });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid snapshot payload");
    // Issues name field paths, never echo payload values.
    expect(JSON.stringify(body.issues)).not.toContain("TEST-PC");
  });

  test("accepts a valid snapshot and is idempotent by snapshotId", async () => {
    const first = await ingest(ingestPayload("snap-idem"));
    expect(first.status).toBe(200);
    expect((await first.json()).snapshotId).toBe("snap-idem");

    const second = await ingest(ingestPayload("snap-idem"));
    expect(second.status).toBe(200);

    const count = await Snapshot.countDocuments({ snapshotId: "snap-idem" });
    expect(count).toBe(1);
  });

  test("scopes stored snapshots to the token's user", async () => {
    await ingest(ingestPayload("snap-owned"));
    const doc = await Snapshot.findOne({ snapshotId: "snap-owned" }).lean<{
      userId: string;
    } | null>();
    expect(doc?.userId).toBe(USER);
  });

  test("enforces the pre-auth per-IP rate limit with 429 + Retry-After", async () => {
    const floodIp = "10.1.0.99";
    let last: Response | null = null;
    // Limit is 60/min; unauthenticated requests still consume the bucket.
    for (let i = 0; i < 61; i++) {
      last = await ingestPOST(
        jsonRequest("http://localhost/api/ingest", {}, { "x-forwarded-for": floodIp })
      );
    }
    expect(last!.status).toBe(429);
    expect(last!.headers.get("Retry-After")).toBeTruthy();
  });
});
