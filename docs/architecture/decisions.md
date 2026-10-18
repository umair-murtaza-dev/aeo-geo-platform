# Architecture decisions

## ADR-001 Modular monolith

The product is one deployable domain split into a web app, an API, and a worker. They share `packages/db` and `packages/shared`. Services are not split into independently deployed microservices. Kubernetes is out of scope.

## ADR-002 Prisma 6.19.3 with Neon pooled and direct URLs

`prisma` and `@prisma/client` are pinned to 6.19.3.

- Prisma 8.0.0-rc was the `latest` dist-tag at the time of M01 and is a release candidate.
- Prisma 7.10.1 is a stable client release, but it moves connection configuration toward driver adapters and `prisma.config.ts`. The Auth.js Prisma adapter was published against the Prisma 6 client generation.
- Prisma 6 supports `url = env("DATABASE_URL")` and `directUrl = env("DIRECT_URL")` in the schema, which matches the Neon pooled runtime URL and the direct migration URL.

Revisit Prisma 7 when the adapter and the connection model are verified together.

TypeScript is 5.9.3. TypeScript 7.0.2 is current, and `typescript-eslint` 8.71.2 declares `typescript >=4.8.4 <6.1.0`, so 7 is not compatible with the linter. ESLint is 10.13.0, which that typescript-eslint release allows.

## ADR-003 Auth.js beta plus a bearer token for Express

Documented in `authentication.md`. The web session cookie is not shared with Express. A 10-minute audience-restricted JWT is the API credential. Organization authority is always reloaded from membership rows.

## ADR-004 Tenant boundaries

An organization is the tenant. An agency and a direct business are both organizations (`AGENCY` or `BUSINESS`). Client workspaces belong to one organization. Brands belong to one workspace, and the foreign key includes `organization_id`, so a brand cannot point at a workspace in another organization.

Evidence tables (`ai_observations`, citations, mentions, prompt versions, audit findings, experiment results, billing events, audit logs) use `ON DELETE RESTRICT` from their parents. Deleting an organization does not cascade through evidence. Memberships can cascade. Workspaces cannot be removed by deleting the organization while they still exist.

Client viewers only see workspaces assigned in `workspace_memberships`. Agency roles see all workspaces in the organization.

## ADR-005 Money and time

Plan prices and billing events use integer minor units plus an ISO currency code. Estimated model cost uses `DECIMAL(18, 6)` plus a currency code. JavaScript floats are not stored as financial values. API contracts serialize decimals as strings.

Timestamps are `timestamptz` and API values are ISO-8601 UTC (`toISOString()`).

## ADR-006 Immutable monitoring evidence

Prompt text is versioned. Observations, citations, mentions, and experiment results are insert-only in the application model: they have `created_at` and no `updated_at`. A monitoring run may update its status. Raw provider payloads are referenced by storage key and SHA-256, not copied into the primary row as the system of record for large bodies.

`AIObservation.surface` separates `MODEL_API`, `GROUNDED_SEARCH`, and `CONSUMER_SEARCH`. A model API response is not treated as a consumer search observation.

## ADR-007 Provider secrets stay out of Postgres

`ai_providers` is a public catalog. `provider_secret_refs.secret_name` is the name of a secret in the external store. The schema has no column for an API key.

## ADR-008 Tests do not clean shared databases

Integration tests run only when `TEST_DATABASE_URL` is set. Non-local hosts are refused unless `ALLOW_REMOTE_TEST_DATABASE=1`. The Prisma test writes inside a transaction and throws to roll it back. Worker tests use a unique BullMQ prefix and `obliterate` that queue only. They do not flush Redis.

## ADR-009 Unimplemented product routes

Visibility, audits, experiments, reports, and billing are contracts and tables. Their HTTP routes are not registered. Calling them returns `404`. The API index lists only implemented routes. Scaffold packages throw `NOT_IMPLEMENTED` if calculation or rendering is called.
