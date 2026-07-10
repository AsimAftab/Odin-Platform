import { describe, expect, test, beforeAll, mock } from "bun:test";
import { NextRequest } from "next/server";
import { jsonRequest, ingestPayload } from "./setup";

// The snapshots list route reads the browser session via `@/lib/session`,
// which pulls in Better Auth + next/headers — neither exists outside a real
// request. Mock the module (before the route is imported) with a switchable
// current user so we can act as different accounts.
let currentUserId: string | null = null;
mock.module("@/lib/session", () => ({
  getSession: async () => ({
    userId: currentUserId,
    user: currentUserId ? { id: currentUserId } : null,
  }),
  requireAuth: async () => {
    if (!currentUserId) throw new Error("Unauthorized");
    return currentUserId;
  },
}));

let listGET: (req: NextRequest) => Promise<Response>;

const USER_A = "user-owner-a";
const USER_B = "user-owner-b";
const IP = "10.3.0.1";

beforeAll(async () => {
  const { connectDB } = await import("@/lib/db");
  await connectDB();
  const { POST: ingestPOST } = await import("@/app/api/ingest/route");
  const { mintApiToken } = await import("@/lib/mint-token");
  ({ GET: listGET } = await import("@/app/api/snapshots/route"));

  // Seed snapshots for two users through the real ingest path.
  for (const [user, ids] of [
    [USER_A, ["own-a-1", "own-a-2", "own-a-3"]],
    [USER_B, ["own-b-1"]],
  ] as const) {
    const token = await mintApiToken(user, "integration");
    for (const id of ids) {
      const res = await ingestPOST(
        jsonRequest("http://localhost/api/ingest", ingestPayload(id, `PC-${user}`), {
          "x-forwarded-for": IP,
          authorization: `Bearer ${token}`,
        })
      );
      expect(res.status).toBe(200);
    }
  }
});

function list(query = "") {
  return listGET(new NextRequest(`http://localhost/api/snapshots${query}`));
}

describe("GET /api/snapshots ownership + pagination", () => {
  test("returns 401 without a session", async () => {
    currentUserId = null;
    const res = await list();
    expect(res.status).toBe(401);
  });

  test("returns only the signed-in user's snapshots", async () => {
    currentUserId = USER_A;
    const body = await (await list()).json();
    expect(body.total).toBe(3);
    const ids = body.items.map((s: { snapshotId: string }) => s.snapshotId);
    expect(ids.sort()).toEqual(["own-a-1", "own-a-2", "own-a-3"]);

    currentUserId = USER_B;
    const other = await (await list()).json();
    expect(other.total).toBe(1);
    expect(other.items[0].snapshotId).toBe("own-b-1");
  });

  test("paginates with clamped limit", async () => {
    currentUserId = USER_A;
    const page1 = await (await list("?limit=2&page=1")).json();
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(3);
    const page2 = await (await list("?limit=2&page=2")).json();
    expect(page2.items).toHaveLength(1);

    // limit is clamped to [1, 50].
    const clamped = await (await list("?limit=9999")).json();
    expect(clamped.limit).toBe(50);
  });
});
