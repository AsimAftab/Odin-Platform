# Self-hosting Odin Platform

The platform is a standard Next.js app with a MongoDB backend and fully
self-hosted auth (Better Auth, email/password) — no external auth provider, so
it runs on any origin.

## Docker Compose (recommended)

Requires Docker with the compose plugin.

```bash
git clone https://github.com/AsimAftab/Odin-Platform.git
cd Odin-Platform

# 32-byte hex secret for signing sessions
export BETTER_AUTH_SECRET=$(openssl rand -hex 32)

docker compose up -d
```

Open <http://localhost:3000>, create an account at `/sign-up`, then pair the
CLI (`odin login --url http://localhost:3000`).

Environment overrides (all optional except the secret):

| Variable | Default | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | — (required) | Session signing secret. |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Public origin of the app. Set this to your real URL behind a reverse proxy. |
| `MAINTAINER_EMAILS` | empty | Comma-separated emails allowed to review catalog requests. |

Snapshot data lives in the `mongo-data` volume.

## Plain Docker

```bash
docker build -t odin-platform .
docker run -d -p 3000:3000 \
  -e MONGODB_URI="mongodb://your-mongo:27017/odin" \
  -e BETTER_AUTH_SECRET="<openssl rand -hex 32>" \
  -e BETTER_AUTH_URL="https://odin.example.com" \
  odin-platform
```

## Health checks

`GET /api/health` is a public liveness/readiness probe returning
`{"status":"ok","db":"up",...}` (or HTTP 503 when the database is
unreachable). The Docker image wires it into `HEALTHCHECK`; point load
balancers and uptime monitors at it. It exposes no user data.

## Behind a reverse proxy

Terminate TLS at your proxy and set `BETTER_AUTH_URL` to the public HTTPS
origin. The app already sends HSTS and a CSP in production.

## Logs

Route handlers log single-line JSON (`lib/logger.ts`) to stdout/stderr —
`docker logs`, Vercel drains, and log shippers can parse `level`, `tag`, and
`message` fields directly.

## Vercel (hosted)

Push the repo, import it in Vercel, and set the same environment variables.
No extra configuration is needed.
