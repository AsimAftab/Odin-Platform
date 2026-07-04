# Contributing to Odin Platform

Thanks for your interest in improving Odin! This repo (`Odin-Platform`) is the
hosted backend and dashboard for the [Odin CLI](https://github.com/AsimAftab/Project-Odin) —
an open-source, Windows-first workstation backup, restore, and migration tool.
Contributions of all kinds are welcome: bug reports, docs, features, and fixes.

## Ways to contribute

- **Report a bug** — open an [issue](https://github.com/AsimAftab/Odin-Platform/issues)
  with steps to reproduce, expected vs. actual behavior, and your environment.
- **Request a feature** — open an issue describing the problem you're trying to
  solve (not just the solution). The roadmap is built in the open.
- **Send a pull request** — for anything non-trivial, open an issue first so we
  can agree on the approach before you invest time.

## Local setup

Requirements: [Bun](https://bun.sh) (or npm) and a MongoDB connection string.
Auth is self-hosted with [Better Auth](https://better-auth.com) — no external
provider or API keys needed, just a generated `BETTER_AUTH_SECRET`.

```bash
bun install
cp .env.example .env.local   # then fill in the values
bun run dev                  # http://localhost:3000
```

See `.env.example` for the required environment variables. The app will not
start without `MONGODB_URI` and `BETTER_AUTH_SECRET`.

## Project conventions

This project pins **Next.js 16** — conventions differ from older Next.js. Before
changing framework code, read the relevant guide in `node_modules/next/dist/docs/`
and see `CLAUDE.md` / `AGENTS.md` for the architecture (two auth paths, the data
model, and Next 16 specifics like `proxy.ts`).

- Run `bun run lint`, `bunx tsc --noEmit`, and `bun test` before opening a PR.
- Keep changes focused; match the style of the surrounding code.
- Never commit secrets — `.env.local` is gitignored; use `.env.example` for docs.
- CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, and build on every PR.

## Changes that touch the CLI

The [Odin CLI](https://github.com/AsimAftab/Project-Odin) talks to this backend
over a small contract: the ingest payload (`POST /api/ingest`), the API token
format (`odin_<keyId>_<secret>`), and the device-authorization flow
(`/api/device/*`). If you change any of those, open the matching PR in the CLI
repo and update `docs/odin-platform-spec.md` (mirrored in both repos).

## Pull request checklist

- [ ] Linked to an issue (for non-trivial changes)
- [ ] `bun run lint` passes
- [ ] `bunx tsc --noEmit` passes
- [ ] `bun test` passes
- [ ] `bun run build` succeeds
- [ ] No secrets or `.env` files committed

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](./LICENSE).
