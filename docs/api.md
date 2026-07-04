# HTTP API Reference

All dashboard routes are scoped to the authenticated Better Auth `userId`. CLI
routes use Bearer API tokens. Unless noted, request/response bodies are JSON.

## Auth model

| Auth | Used by | How |
| --- | --- | --- |
| Session cookie | Dashboard / browser | Better Auth; server reads via `getSession()` |
| Bearer token | Odin CLI | `Authorization: Bearer odin_<keyId>_<secret>` |
| device_code | `odin login` polling | RFC 8628 device grant |

## CLI-facing routes

### `POST /api/ingest`
Upload a snapshot. **Auth:** Bearer token. Rate-limited (per-IP + per-user),
size-capped at 2 MB, schema-validated (`lib/ingest-schema.ts`).

Body (sections match the CLI's local snapshot files):

```json
{
  "machine":     { "hostname": "...", "captured_at": "<ISO>", "os_name": "...", "os_version": "...", "username": "..." },
  "environment": { "...": "..." },
  "packages":    { "packages": [ { "id": "...", "name": "...", "version": "...", "source": "winget" } ] },
  "vscode":      { "extensions": [ { "identifier": "...", "version": "..." } ] },
  "git":         { "entries": [ { "key": "user.name", "value": "..." } ] },
  "lock":        { "snapshot_id": "<uuid>", "schema_version": 1 },
  "profiles":    { "...": "..." },
  "tag":         "optional-label"
}
```

The `packages` map is keyed by manager and is intentionally **open** — the CLI
adds new managers without a coordinated server change. `lockSha256` is computed
server-side (SHA-256 over the captured sections).

Response: `{ "ok": true, "snapshotId": "..." }`. Errors: `400` (invalid
JSON/payload), `401` (bad token), `413` (too large), `429` (rate limited).

### `GET /api/cli/me`
Identity probe. **Auth:** Bearer token. Returns the connected account email.

### Device authorization (RFC 8628)
- `POST /api/device/code` — **public.** Issues `device_code` + `user_code`. Rate-limited per IP.
- `POST /api/device/approve` — **session.** Approve/deny a `user_code` (from `/activate`).
- `POST /api/device/token` — **public** (holds `device_code`). Poll for the token; mints it once. Rate-limited per IP; per-code pacing via `interval`.

## Dashboard / client routes (session-authenticated)

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/tokens` | GET / POST / DELETE | List, mint (returns raw once), revoke API tokens |
| `/api/snapshots` | GET | Paginated snapshot list (`?page`, `?limit≤50`, `?machineId`) → `{ items, total, page, limit }` |
| `/api/snapshots/[id]` | GET / DELETE | Fetch or delete one snapshot (ownership-checked) |
| `/api/snapshots/[id]/export` | GET | Download a PowerShell restore script (`text/plain` attachment) |
| `/api/snapshots/diff` | GET | Diff two snapshots (`?a=&b=`, both owned) → `{ diff }` |
| `/api/machines` | GET | List the user's machines |
| `/api/settings` | GET / PATCH | Read/update user settings (snapshot retention) |
| `/api/maintainer` | GET | Whether the caller is a catalog maintainer |
| `/api/catalog/requests` | GET / POST | The user's tool requests / submit a request |
| `/api/catalog/requests/[id]` | PATCH / DELETE | Maintainer: edit/transition/approve/delete |

## Public routes

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/catalog` | GET | Browse the tool catalog (`?q`, `?category`, `?page`, `?limit≤500`). Also consumed by the CLI. Lazily seeds when empty. |
| `/api/auth/[...all]` | GET / POST | Better Auth handler (sign-in/up, session, etc.) |
