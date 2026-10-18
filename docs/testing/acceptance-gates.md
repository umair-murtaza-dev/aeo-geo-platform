# Acceptance gates

A change is ready to merge when the checks below have been executed on the branch and the results are recorded in the task or pull request. Skipped checks are written as skipped, with the reason. They are not described as passed.

## Local sequence

```bash
pnpm install
pnpm db:generate
pnpm validate
```

`pnpm validate` runs, in order:

1. `prisma generate`
2. lint
3. typecheck
4. unit and integration tests
5. production builds of the web app, API, and worker

Browser smoke, after the web build and a one-time Chromium install:

```bash
pnpm --filter @aeo/web exec playwright install chromium
pnpm --filter @aeo/web test:e2e
```

## Database

- `pnpm db:check` against the intended database before any migration.
- If public tables already exist and they were not created by this project, stop. Do not migrate.
- `prisma migrate deploy` only on an empty database you own, or on the disposable CI Postgres.
- Never `prisma migrate reset`, `DROP`, or `TRUNCATE` on the Neon development database.
- Tests that write data require `TEST_DATABASE_URL`. Localhost is accepted. Any other host requires `ALLOW_REMOTE_TEST_DATABASE=1` and must still be a disposable database.

## Redis

Worker integration tests use a unique key prefix and delete only that queue. They do not flush the Redis database.

## Pull requests

Chat G does not merge a feature that lacks the command output for lint, typecheck, test, and build. Schema changes additionally include `prisma validate` and a note of whether `migrate deploy` was run, and against which host (hostname only, never the URL).
