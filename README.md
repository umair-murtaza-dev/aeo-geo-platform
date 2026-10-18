# AEO/GEO platform

Multi-tenant foundation for agencies and businesses that will track brand visibility across AI search systems. Milestone M01 provides the repository, database contract, API shell, authentication bridge, worker shell, and parallel-development rules. It does not query AI providers or calculate visibility.

## Requirements

- Node.js 20.9 or newer. This repository was built with Node.js 24.15.0 (see `.nvmrc`).
- pnpm 12.3.4 (`packageManager` field).
- A Neon Postgres database for application data, when you are ready to migrate.
- Redis for the worker. `infrastructure/docker/docker-compose.yml` can start a local Redis and a disposable test Postgres.

## Setup

```bash
pnpm install
cp .env.example .env
# Edit .env locally. Do not commit it.
pnpm db:generate
pnpm db:check
```

`pnpm db:check` is read-only. It prints the database host and public table names. It does not migrate.

Apply the migration only after `db:check` shows an empty database that you own:

```bash
pnpm db:migrate:deploy
```

Do not run `prisma migrate reset` against a shared or unknown database.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm validate` | Generate the Prisma client, then lint, typecheck, test, and build. |
| `pnpm --filter @aeo/web dev` | Next.js on port 3000. |
| `pnpm --filter @aeo/api dev` | Express on port 4000, via `tsx`. |
| `pnpm --filter @aeo/worker dev` | BullMQ worker. Requires `REDIS_URL`. |
| `pnpm --filter @aeo/web build && pnpm --filter @aeo/web start` | Production Next.js on port 3000. |
| `pnpm --filter @aeo/api build && pnpm --filter @aeo/api start` | Production Express bundle (`dist/index.cjs`) on port 4000. |
| `pnpm --filter @aeo/worker build && pnpm --filter @aeo/worker start` | Production worker. Requires `REDIS_URL`. |
| `pnpm --filter @aeo/web test:e2e` | Playwright smoke test. Requires a production build and Chromium. |

`AUTH_SECRET` must be at least 32 characters before login or authenticated API calls succeed. The API process still starts without it. Readiness returns `not_configured` when `DATABASE_URL` is absent.

## Applications

- `apps/web` — Next.js App Router, Tailwind CSS, shadcn-style UI components in `packages/ui`.
- `apps/api` — Express API under `/api/v1`.
- `apps/worker` — BullMQ worker. The monitoring processor does not call providers.

## How the browser authenticates to Express

Auth.js sessions stay on the Next.js origin as an HttpOnly JWT cookie. Express does not read that cookie. The browser, or a Next.js server component, calls `GET /api/session/access-token`. That route returns a 10-minute bearer token signed with `AUTH_SECRET`, audience `aeo-api`. Express verifies the token and then loads membership from the database. Organization ids sent by the client are selections, not authority. Details are in `docs/architecture/authentication.md`.

## Layout

Module ownership and worktree rules are in `docs/architecture/module-ownership.md` and `docs/architecture/parallel-development.md`.
