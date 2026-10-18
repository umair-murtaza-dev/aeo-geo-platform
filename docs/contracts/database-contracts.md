# Database contracts

## Connections

- `DATABASE_URL` is the pooled Neon connection used by the API, web server actions, and worker if it later reads Postgres.
- `DIRECT_URL` is the direct Neon connection used by Prisma migrations. Do not point migrations at the pooler.
- Both values are read from the environment. They are not committed.
- `.env.example` contains placeholders only.

`pnpm db:check` connects, runs `SELECT 1`, and lists `public` tables. It does not print the URL, username, or password. It does not migrate.

## Identity and tenancy

- `users` plus `accounts`, `sessions`, and `verification_tokens` match the Auth.js Prisma adapter field names, including `refresh_token` and `session_token`.
- `organizations.kind` distinguishes an agency from a direct business.
- `organization_memberships` is the only source of organization role.
- `client_workspaces` are the client boundary inside an organization.
- `workspace_memberships` grant a user access to one workspace. Client viewers are filtered with this table. Agency roles are not.
- Brands, domains, locations, and competitors are tenant-scoped through `organization_id` and, where required, a composite foreign key.

## Evidence

- Prompt bodies live in `prompt_versions` and are not updated.
- `monitoring_runs.idempotency_key` is unique.
- `ai_observations` record surface, engine, locale, market, timestamps, token counts, decimal costs, currency, and `raw_response_ref`.
- Citations and mentions are children of an observation and are restricted from disappearing with a casual parent delete.
- Experiment cohorts point at observation ids. They do not copy the provider payload.

## Money

- `plans.amount_minor` and `billing_events.amount_minor` are integers.
- `usage_records.quantity` and observation costs are `DECIMAL(18, 6)`.
- Currency is a 3-character code stored beside the amount.

## Safety

Do not reset, drop, or truncate a database that already has tables you did not create. The initial migration is `packages/db/prisma/migrations/20261018120000_init`. Apply it with `pnpm db:migrate:deploy` only on an approved empty database. That command loads the root `.env`, uses `DIRECT_URL`, and refuses a pooled host.

Additional SQL in that migration, which Prisma's schema language does not express directly:

- one primary domain per brand
- a brand mention cannot set both `brand_id` and `competitor_id`
