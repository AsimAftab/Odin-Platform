# Odin Platform

[![CI](https://github.com/AsimAftab/Odin-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/AsimAftab/Odin-Platform/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

The hosted backend + dashboard for the [**Odin CLI**](https://github.com/AsimAftab/Project-Odin) — an open-source, Windows-first workstation backup, restore, and migration tool.

The CLI captures your machine's state (installed packages, VS Code extensions, Git config, environment/PATH) into portable snapshots. Odin Platform is where those snapshots land: browse machines and snapshot history, diff two snapshots, inspect a Config Vault, check PATH/tool health, export a restore script, and browse a public tool catalog — all scoped to your account. Self-hostable; the hosted version is a convenience layer, not lock-in.

> The CLI works fully standalone (local snapshots + optional GitHub sync). The platform is an **opt-in** remote.

## Stack

Next.js 16 (App Router) · React 19 · [Better Auth](https://better-auth.com) (self-hosted email/password) · MongoDB / Mongoose 9 · Tailwind v4 · shadcn on `@base-ui/react`. Package manager: **Bun**.

## Quick start (local)

```bash
bun install
cp .env.example .env.local   # then fill in the values
bun run dev                  # http://localhost:3000
```

You need a MongoDB connection string and a generated auth secret — see [Environment](#environment). Then create an account at `/sign-up`, and pair the CLI (below).

### Scripts

```bash
bun run dev        # next dev (Turbopack)
bun run build      # next build
bun run start      # next start (prod)
bun run lint       # eslint
bun test           # unit tests (bun:test)
bun run seed:catalog   # upsert the tool catalog seed data
```

## Environment

Copy `.env.example` to `.env.local`. All are required except where noted.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Mongoose connection string. Better Auth's collections (`user`, `session`, `account`, `verification`) live in the **same** database. The app throws at startup if this is missing. |
| `BETTER_AUTH_SECRET` | 32-byte hex secret for signing sessions. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `BETTER_AUTH_URL` | App origin, e.g. `http://localhost:3000` locally or your deployed URL in prod. |
| `MAINTAINER_EMAILS` | Comma-separated emails allowed to review catalog tool requests at `/dashboard/requests`. Optional. |

## Pairing the Odin CLI

**Recommended — browser login (OAuth 2.0 device flow, RFC 8628):**

```powershell
odin login --url https://your-platform.example.com
# approve the shown code in the browser at /activate
```

**CI / headless — API token:** generate one under **Settings → Generate API Token** (shown once), then:

```powershell
odin config platform --url https://your-platform.example.com --token odin_xxxx...
odin snapshot --push
```

Tokens use the format `odin_<keyId>_<secret>`; the CLI treats them as opaque and stores them in the OS credential store. See [`docs/`](./docs) for the full contract.

## Features

- **Overview / Machines** — connected machines with their latest package/extension counts.
- **Snapshots** — paginated history; each detail page shows packages by source, VS Code extensions, and Git config.
- **Snapshot diff** — compare any two snapshots of a machine (packages/extensions/env added, removed, changed).
- **Restore script export** — download a reviewable PowerShell bootstrap generated from a snapshot.
- **Config Vault** — Git config, extensions, PowerShell profile, and env vars, with secret-looking values masked by default.
- **Health** — broken PATH entries and essential-tool detection.
- **Tool catalog** — public, curated dev-tool catalog with `winget`/`choco`/`scoop` install commands + a missing-tool request workflow.
- **Settings** — mint/list/revoke API tokens and set per-machine snapshot retention.

## Deploy

Deploys cleanly to Vercel (or any Node host). Set the four env vars above in your host's project settings. Better Auth is fully self-hosted (no external provider), so it works on any origin including `*.vercel.app`.

**Self-hosting with Docker:**

```bash
export BETTER_AUTH_SECRET=$(openssl rand -hex 32)
docker compose up -d        # app + MongoDB, http://localhost:3000
```

See [`docs/self-hosting.md`](./docs/self-hosting.md) for the full guide. `GET /api/health` is a public liveness probe for load balancers and monitors.

## Documentation

- [`docs/architecture.md`](./docs/architecture.md) — how the app is structured (two auth paths, data ownership, Next 16 conventions).
- [`docs/api.md`](./docs/api.md) — HTTP API reference (the CLI contract + dashboard routes).
- [`docs/odin-platform-spec.md`](./docs/odin-platform-spec.md) — product spec (mirrored with the CLI repo).
- [`docs/odin-platform-tasks.md`](./docs/odin-platform-tasks.md) — phased task plan and status.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`SECURITY.md`](./SECURITY.md)

## License

[MIT](./LICENSE)
