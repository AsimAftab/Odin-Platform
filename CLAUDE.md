# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: read the bundled Next.js docs first

This repo pins **Next.js 16** — APIs and file conventions differ from older Next.js in your training data. Before writing or changing any Next.js code, read the relevant guide under `node_modules/next/dist/docs/` (App Router docs live in `01-app/`). Heed deprecation notices there. This is enforced by `AGENTS.md`.

Notable Next 16 conventions already in use here:
- **Middleware is `proxy.ts`** (repo root), not `middleware.ts` — see `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.
- Server-side session lookup (`getSession()` in `lib/session.ts`) is **async** and must be awaited.
- Route handler params are async (`await params`).

## Commands

Package manager is **Bun** (`bun.lock`). npm also works.

```bash
bun install
bun run dev      # next dev (Turbopack)
bun run build    # next build
bun run start    # next start (prod)
bun run lint     # eslint (flat config: eslint.config.mjs)
```

There is no test suite configured. `MONGODB_URI` and the Better Auth vars must be set (see below) or `dev`/`build` will throw at DB connect / auth. See `.env.example`.

## Required environment

- `MONGODB_URI` — Mongoose connection string. `lib/db.ts` throws on startup if missing. Better Auth's collections (`user`, `session`, `account`, `verification`) live in the **same** database via a separate `MongoClient` in `lib/auth.ts`.
- `BETTER_AUTH_SECRET` — 32-byte hex secret for signing sessions.
- `BETTER_AUTH_URL` — app origin (e.g. `http://localhost:3000`, or the deployed URL in prod).

## Architecture

Odin Platform is the hosted backend + dashboard for the **Odin CLI**, a Windows-first workstation backup/restore tool. The CLI pushes machine snapshots (packages, VS Code extensions, Git config, env/PATH) here; the web dashboard browses them.

**Stack:** Next.js 16 App Router · React 19 · Better Auth (self-hosted) · MongoDB/Mongoose 9 · Tailwind v4 · shadcn (see UI note below).

### Two authentication paths — keep them separate

1. **Better Auth session** (browser). Email/password, self-hosted — no external provider, works on any origin including `*.vercel.app`.
   - Server instance: `lib/auth.ts` (`export const auth = betterAuth(...)`). Endpoints are served by the catch-all `app/api/auth/[...all]/route.ts`.
   - Server-side reads: `getSession()` / `requireAuth()` in `lib/session.ts` — the drop-in for the old `auth()`, returns `{ userId, user }`.
   - Client: `lib/auth-client.ts` (`signIn`, `signUp`, `signOut`, `useSession`).
   - `proxy.ts` guards `/dashboard` with an **optimistic cookie check** (`getSessionCookie`, no DB call — edge-safe) and redirects to `/sign-in`. API routes self-guard via `getSession()` returning 401.
2. **Bearer API token** (CLI). `/api/ingest` authenticates via `validateApiToken()` (`lib/api-token.ts`), which bcrypt-compares the raw token against every stored `ApiToken.tokenHash` (linear scan — hashes aren't reversible/queryable). Tokens are minted in `app/api/tokens/route.ts` (`odin_<hex>`), returned **once**, and only the bcrypt hash is persisted.

Public routes (no session needed): `/`, `/sign-in`, `/sign-up`, `/api/auth/*`, `/api/ingest`. Only `/dashboard` is force-guarded in `proxy.ts`.

### Data ownership

Every model is scoped by **`userId` (a string = Better Auth user id)**, not a Mongo ref. All queries must filter by the authenticated `userId`; there is no cross-user access. Models (`models/`):
- `Machine` — unique per `(userId, hostname)`, upserted on ingest.
- `Snapshot` — one per CLI snapshot UUID; `snapshotId` is globally unique so ingest is **idempotent** (findOneAndUpdate upsert). Large captured payloads (`machine`, `packages`, `vscode`, `git`, `environment`) are stored as `Schema.Types.Mixed`.
- `ApiToken` — bcrypt hash + label per user.

`lib/db.ts` caches the Mongoose connection on `global` (serverless-safe). Models use the `mongoose.models.X || mongoose.model(...)` guard to survive hot-reload — follow that pattern for new models.

### Data access patterns

- **Server Components** (dashboard pages, e.g. `app/dashboard/snapshots/page.tsx`) call `getSession()` + `connectDB()` and query Mongoose directly, then `.lean()`. They are the read path for the UI.
- **Route handlers** (`app/api/*`) are for the CLI (`/api/ingest`) and any client-side mutations (`/api/tokens`, etc.). They return `NextResponse.json`.

When passing Mongoose docs to Client Components, serialize (`_id.toString()`, etc.) — see the `machineMap` pattern in the snapshots page.

### UI

- shadcn is configured with the **`base-nova` style on top of `@base-ui/react`** (not Radix) — `components.json`. Generated primitives live in `components/ui/`.
- `cn()` (clsx + tailwind-merge) from `lib/utils.ts` for class composition.
- Tailwind v4 (CSS-first, `app/globals.css`, `@tailwindcss/postcss`). App is dark-mode-locked (`<html class="dark">`) with a yellow (`yellow-300/400`) accent.
- Icons: `lucide-react`.

### Import alias

`@/*` maps to the repo root (`tsconfig.json`), e.g. `@/lib/db`, `@/models/Snapshot`, `@/components/ui/card`.
