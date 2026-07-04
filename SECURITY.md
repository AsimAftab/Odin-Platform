# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Report privately via
GitHub's [private vulnerability reporting](https://github.com/AsimAftab/Odin-Platform/security/advisories/new)
or email **alushmkr@gmail.com**. Include steps to reproduce and the impact you
believe it has. We aim to acknowledge within a few days.

## Supported versions

This is a young project without formal LTS branches; security fixes land on
`main`. Self-hosters should track `main`.

## How Odin Platform handles secrets

- **API tokens** are shown to the user exactly once and stored only as bcrypt
  hashes (`ApiToken.tokenHash`). The raw token is never persisted. Tokens use the
  format `odin_<keyId>_<secret>`, where `keyId` is a public lookup id and the
  secret half is what bcrypt protects. Only this format is accepted.
- **Sessions** are signed with `BETTER_AUTH_SECRET` (self-hosted Better Auth).
- **Data ownership**: every record is scoped by the authenticated `userId`. There
  is no cross-user access; all queries filter by `userId`, and exports/diffs
  re-check ownership.
- **Ingest** (`POST /api/ingest`) is Bearer-authenticated, validated against a
  schema (`lib/ingest-schema.ts`), size-capped (2 MB), and rate-limited.
- **Rate limiting**: the device-auth and ingest routes use a Mongo-backed
  fixed-window limiter (`lib/rate-limit.ts`); auth endpoints use Better Auth's
  built-in limiter.
- **Config Vault**: env-var values and PowerShell profile content that look
  secret-bearing (by name or value shape) are masked by default in the UI. This
  is a second layer — the CLI also redacts secrets *before* upload.

## Notes for self-hosters

- Keep `BETTER_AUTH_SECRET` out of source control; generate a fresh 32-byte hex
  value per deployment.
- Restrict `MAINTAINER_EMAILS` to accounts you control.
- Snapshot payloads can contain sensitive machine detail. Treat your MongoDB
  instance as holding personal data and secure it accordingly.
