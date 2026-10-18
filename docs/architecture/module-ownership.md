# Module ownership

Each chat works in its own Git worktree and branch. Do not edit another chat's directories except through a contract-change request reviewed by Chat A (schema and root config) or Chat G (integration).

| Chat | Owns | Does not edit |
| --- | --- | --- |
| A | `packages/db/prisma/schema.prisma`, migrations, `packages/shared` contracts, root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, auth and tenant foundations | Feature logic in B–F packages |
| B | `packages/ai-providers`, `apps/worker` monitoring execution, prompt and run services | Prisma schema, analytics formulas |
| C | `packages/analytics`, audit and recommendation services | Provider adapters, experiment statistics |
| D | `packages/experiments` statistical comparison | Observation ingestion |
| E | `apps/web` product screens, `packages/ui`, `packages/reporting` | API auth middleware, schema |
| F | `infrastructure/`, billing services, CI quality gates beyond the M01 workflow | Tenant permission matrix |
| G | Integration branch, contract review, release notes | Feature implementation hidden inside another chat's branch |

`apps/api` route modules are split by area once those routes exist:

- Chat A: `/api/v1/auth`, `/api/v1/organizations`, membership, health
- Chat B: prompts, schedules, runs, observations
- Chat C: audits, recommendations, visibility
- Chat D: experiments
- Chat E: reports
- Chat F: subscriptions, usage, billing

Until a route exists, the contract lives in `packages/shared` and `docs/contracts`. Do not register a route that returns invented data.

## Shared files

These files are single-writer during parallel work:

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/**`
- Root package manager and TypeScript config
- `packages/shared/src/permissions.ts`
- `packages/shared/src/contracts/**` when the change alters a published field

A chat that needs a new column or a new public field files a contract-change request using `docs/tasks/task-template.md`. Chat A applies schema changes. Chat G merges only with the acceptance evidence in `docs/testing/acceptance-gates.md`.

## Public interfaces

Other packages import types and Zod schemas from `@aeo/shared`. They do not duplicate DTO field lists in app code. Provider adapters implement `AIProviderAdapter` from `@aeo/ai-providers`.
