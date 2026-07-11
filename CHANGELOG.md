# Changelog

All notable changes to Odin Platform are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The platform is deployed continuously from `main` and does not cut versioned
releases yet; entries are grouped by merged pull request instead.

## [Unreleased]

## Merged history

- **#16** — Self-hosting: `GET /api/health` liveness probe, multi-stage
  Dockerfile + docker-compose (app + MongoDB), structured JSON logging.
- **#17** — Snapshot-staleness badges on the machines page (fresh/aging/stale).
- **#9** — Route-level integration test suite on mongodb-memory-server
  (ingest, device flow, ownership isolation).
- **#8** — OSS hygiene: code of conduct, changelog, CODEOWNERS, dependabot,
  badges, engines pin, dependency-review CI job.
- **#7** — Rate limits on session-gated mutations (token minting, tool
  requests, settings), security headers/CSP, `requireAuth()` on the health
  page.

- **#6** — Short-id prefix lookup for `GET /api/snapshots/[id]` + copyable full
  snapshot id in the dashboard.
- **#5** — Restore-script failure summary + unsafe-id guard in the exported
  PowerShell script.
- **#4** — Fixed winget msstore source ambiguity in export, guarded
  restore-script managers, CLI can pull snapshots from the platform.
- **#3** — OSS hardening: CI workflow, keyed API tokens (`odin_<keyId>_<secret>`,
  O(1) validation), Mongo-backed rate limiting, snapshot diff and export,
  contributor docs.
- **#2** — Profiles page, catalog coverage view, amber design system, health
  page fix.
- **#1** — RFC 8628 device-authorization login (`/activate`) + `/api/cli/me`
  for the Odin CLI.
- Earlier — public tool catalog with install commands and a request→approve
  maintainer workflow; self-hosted Better Auth replacing Clerk; initial
  dashboard (machines, snapshots, Config Vault, health) and `/api/ingest`.
