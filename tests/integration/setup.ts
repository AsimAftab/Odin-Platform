import { MongoMemoryServer } from "mongodb-memory-server";
import { NextRequest } from "next/server";

// One in-memory mongod for the whole integration suite. This module MUST be
// imported before anything that (transitively) imports `@/lib/db`, which
// captures MONGODB_URI at import time — hence route modules are loaded with
// dynamic `import()` inside the test files, after this has run.
export const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri("odin_integration");

/** Builds a JSON POST NextRequest for calling route handlers directly. */
export function jsonRequest(
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

/** Minimal valid /api/ingest payload for a given snapshot id. */
export function ingestPayload(snapshotId: string, hostname = "TEST-PC") {
  return {
    machine: { hostname, captured_at: new Date().toISOString() },
    environment: {},
    packages: {},
    vscode: {},
    git: {},
    lock: { snapshot_id: snapshotId },
  };
}
