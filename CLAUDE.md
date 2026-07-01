# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: read the bundled Next.js docs first

This repo pins **Next.js 16** — APIs and file conventions differ from older Next.js in your training data. Before writing or changing any Next.js code, read the relevant guide under `node_modules/next/dist/docs/` (App Router docs live in `01-app/`). Heed deprecation notices there. This is enforced by `AGENTS.md`.

Notable Next 16 conventions already in use here:
- **Middleware is `proxy.ts`** (repo root), not `middleware.ts` — see `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.
- `auth()` from `@clerk/nextjs/server` is **async** and must be awaited.
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

There is no test suite configured. `MONGODB_URI` and Clerk keys must be set (see below) or `dev`/`build` will throw at DB connect / auth.

## Required environment

- `MONGODB_URI` — Mongoose connection string. `lib/db.ts` throws on startup if missing.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — Clerk v7 auth.

## Architecture

Odin Platform is the hosted backend + dashboard for the **Odin CLI**, a Windows-first workstation backup/restore tool. The CLI pushes machine snapshots (packages, VS Code extensions, Git config, env/PATH) here; the web dashboard browses them.

**Stack:** Next.js 16 App Router · React 19 · Clerk v7 · MongoDB/Mongoose 9 · Tailwind v4 · shadcn (see UI note below).

### Two authentication paths — keep them separate

1. **Clerk session** (browser). Guards the dashboard and most API routes. `proxy.ts` calls `auth.protect()` on everything except the public matchers. `requireAuth()` in `lib/auth.ts` is the helper.
2. **Bearer API token** (CLI). Only `/api/ingest` is public in `proxy.ts` so the CLI can post without a Clerk session. It authenticates via `validateApiToken()` (`lib/auth.ts`), which bcrypt-compares the raw token against every stored `ApiToken.tokenHash` (linear scan — hashes aren't reversible/queryable). Tokens are minted in `app/api/tokens/route.ts` (`odin_<hex>`), returned **once**, and only the bcrypt hash is persisted.

When adding a route the CLI must reach, remember to add it to `isPublicRoute` in `proxy.ts`.

### Data ownership

Every model is scoped by **Clerk `userId` (a string)**, not a Mongo ref. All queries must filter by the authenticated `userId`; there is no cross-user access. Models (`models/`):
- `Machine` — unique per `(userId, hostname)`, upserted on ingest.
- `Snapshot` — one per CLI snapshot UUID; `snapshotId` is globally unique so ingest is **idempotent** (findOneAndUpdate upsert). Large captured payloads (`machine`, `packages`, `vscode`, `git`, `environment`) are stored as `Schema.Types.Mixed`.
- `ApiToken` — bcrypt hash + label per user.

`lib/db.ts` caches the Mongoose connection on `global` (serverless-safe). Models use the `mongoose.models.X || mongoose.model(...)` guard to survive hot-reload — follow that pattern for new models.

### Data access patterns

- **Server Components** (dashboard pages, e.g. `app/dashboard/snapshots/page.tsx`) call `auth()` + `connectDB()` and query Mongoose directly, then `.lean()`. They are the read path for the UI.
- **Route handlers** (`app/api/*`) are for the CLI (`/api/ingest`) and any client-side mutations (`/api/tokens`, etc.). They return `NextResponse.json`.

When passing Mongoose docs to Client Components, serialize (`_id.toString()`, etc.) — see the `machineMap` pattern in the snapshots page.

### UI

- shadcn is configured with the **`base-nova` style on top of `@base-ui/react`** (not Radix) — `components.json`. Generated primitives live in `components/ui/`.
- `cn()` (clsx + tailwind-merge) from `lib/utils.ts` for class composition.
- Tailwind v4 (CSS-first, `app/globals.css`, `@tailwindcss/postcss`). App is dark-mode-locked (`<html class="dark">`) with a yellow (`yellow-300/400`) accent.
- Icons: `lucide-react`.

### Import alias

`@/*` maps to the repo root (`tsconfig.json`), e.g. `@/lib/db`, `@/models/Snapshot`, `@/components/ui/card`.
