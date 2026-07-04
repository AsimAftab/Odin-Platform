import { z } from "zod";

// Validation for the `POST /api/ingest` body sent by the Odin CLI. The captured
// payloads (machine/environment/packages/vscode/git) are large and evolve with
// the CLI, so sub-shapes stay permissive (`.passthrough()` / open records) —
// the goal is to reject malformed/oversized junk and pin the few fields the
// server actually reads, NOT to mirror the CLI's full schema. In particular the
// `packages` map is keyed by manager name and MUST stay open: the CLI adds new
// managers (pipx, pnpm, dotnet, go, uv, …) without a coordinated server change.

const isoDateString = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: "invalid date" });

export const ingestSchema = z
  .object({
    machine: z
      .object({
        hostname: z.string().min(1).max(256),
        captured_at: isoDateString,
        os_name: z.string().max(128).optional(),
        os_version: z.string().max(128).optional(),
        username: z.string().max(256).optional(),
      })
      .passthrough(),
    environment: z.record(z.string(), z.unknown()),
    // Manager name -> arbitrary list/shape. Open by design (see note above).
    packages: z.record(z.string(), z.unknown()),
    vscode: z.record(z.string(), z.unknown()),
    git: z.record(z.string(), z.unknown()),
    lock: z
      .object({
        snapshot_id: z.string().min(1).max(128),
        schema_version: z.number().int().optional(),
      })
      .passthrough(),
    profiles: z.unknown().optional(),
    tag: z.string().max(120).optional(),
  })
  .passthrough();

export type IngestPayload = z.infer<typeof ingestSchema>;

// Reject bodies larger than this before parsing — the captured payloads are
// substantial but bounded; anything much larger is abuse or a bug.
export const MAX_INGEST_BYTES = 2 * 1024 * 1024; // 2 MB
