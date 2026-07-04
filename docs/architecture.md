# Architecture

Odin Platform is the hosted backend + dashboard for the Odin CLI. The CLI pushes
machine snapshots (packages, VS Code extensions, Git config, env/PATH) here; the
web dashboard browses them.

**Stack:** Next.js 16 App Router · React 19 · Better Auth (self-hosted) ·
MongoDB/Mongoose 9 · Tailwind v4 · shadcn on `@base-ui/react`.

> **Next.js 16 note:** conventions differ from older Next.js. Middleware is
> `proxy.ts` at the repo root (not `middleware.ts`); `getSession()` is async;
> route/`params`/`searchParams` are async and must be awaited. Read the bundled
> guides under `node_modules/next/dist/docs/` before changing framework code.

## Two authentication paths — keep them separate

1. **Better Auth session (browser).** Email/password, self-hosted, works on any
   origin.
   - Server instance: `lib/auth.ts`. Endpoints served by the catch-all
     `app/api/auth/[...all]/route.ts`.
   - Server-side reads: `getSession()` / `requireAuth()` in `lib/session.ts`.
   - Client: `lib/auth-client.ts`.
   - `proxy.ts` guards `/dashboard` with an optimistic cookie check (no DB call,
     edge-safe) and redirects to `/sign-in`. API routes self-guard via
     `getSession()` returning 401.
2. **Bearer API token (CLI).** `POST /api/ingest` authenticates via
   `validateApiToken()` (`lib/api-token.ts`). Tokens are minted as
   `odin_<keyId>_<secret>` (`lib/mint-token.ts`), returned once, and stored only
   as a bcrypt hash plus the public `keyId`. Validation looks the hash up by
   `keyId` in O(1); only this format is accepted.

Public routes (no session): `/`, `/sign-in`, `/sign-up`, `/api/auth/*`,
`/api/ingest`, `/api/catalog`, `/activate`, `/api/device/*`. Only `/dashboard` is
force-guarded in `proxy.ts`.

## Data ownership

Every model is scoped by **`userId`** (a string = Better Auth user id). All
queries filter by the authenticated `userId`; there is no cross-user access.

Models (`models/`):
- **Machine** — unique per `(userId, hostname)`, upserted on ingest.
- **Snapshot** — one per CLI snapshot UUID; `snapshotId` is globally unique so
  ingest is idempotent. Large captured payloads are stored as `Schema.Types.Mixed`.
  `lockSha256` is a server-computed SHA-256 over the captured sections.
- **ApiToken** — bcrypt hash + public `keyId` + label per user.
- **DeviceCode** — RFC 8628 device-flow record with a TTL index.
- **RateLimit** — fixed-window counter with a TTL index (see `lib/rate-limit.ts`).
- **UserSettings** — per-user preferences (snapshot retention).
- **CatalogTool** / **ToolRequest** — public catalog + user-submitted requests.

`lib/db.ts` caches the Mongoose connection on `global` (serverless-safe). Models
use the `mongoose.models.X || mongoose.model(...)` guard to survive hot-reload —
follow that pattern for new models.

## Data access patterns

- **Server Components** (dashboard pages) call `getSession()`/`requireAuth()` +
  `connectDB()` and query Mongoose directly, then `.lean()`. When passing docs to
  Client Components, serialize (`_id.toString()`, dates to ISO strings).
- **Route handlers** (`app/api/*`) serve the CLI (`/api/ingest`, `/api/cli/me`,
  `/api/device/*`) and client-side mutations. They return `NextResponse.json`.

The N+1 "latest snapshot per machine" read is a single aggregation in
`lib/snapshot-queries.ts` (counts computed in Mongo, heavy payloads never
returned), backed by the `{ userId, machineId, capturedAt }` index.

## Rate limiting

`lib/rate-limit.ts` implements a Mongo-backed fixed-window limiter (atomic
`$inc` upsert + TTL). Applied to `/api/device/code`, `/api/device/token`, and
`/api/ingest` (per-IP and per-user). It fails open on DB errors. Auth endpoints
use Better Auth's built-in limiter (configured in `lib/auth.ts`).

## Tool catalog

Public, curated catalog of dev tools + install commands. `lib/ensure-catalog.ts`
lazily seeds when empty (called from the page and `GET /api/catalog`). Seed data
in `lib/catalog-seed.ts`; `bun run seed:catalog` upserts by slug. `buildCommand()`
in `lib/catalog-util.ts` produces safe per-manager install commands (also reused
by the restore-script export).

## Import alias

`@/*` maps to the repo root (`tsconfig.json`), e.g. `@/lib/db`,
`@/models/Snapshot`, `@/components/ui/card`.
