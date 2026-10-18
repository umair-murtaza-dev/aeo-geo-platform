# Parallel development

M01 does not create extra worktrees. Create them after this branch is accepted and the working tree is clean.

## Rules

1. One chat, one worktree, one branch.
2. Do not have two chats edit the same file.
3. Prisma schema changes belong to Chat A.
4. Root package and config changes belong to Chat A until Chat G accepts an integration handoff.
5. Cross-module changes need a contract-change request.
6. Public interfaces live in `packages/shared` or the contract docs.
7. Each change includes the tests that cover it.
8. Do not merge to the integration branch without the acceptance gates.
9. If a contract is missing, ask or write an explicit proposal. Do not invent a success payload.
10. A task is not complete until its checks have been executed and the result recorded.

## Create a worktree

From a clean checkout of the accepted M01 branch:

```bash
git status
git worktree add ../aeo-chat-b -b feature/chat-b-monitoring
```

Repeat with a new directory and branch for chats C–F. Chat G can use `feature/integration`.

Do not run `git worktree add` inside an unrelated repository, and do not create a nested `.git` directory. Do not force-push. Do not switch away from a dirty branch to "get a clean tree".

Suggested branch names:

- `feature/chat-b-monitoring`
- `feature/chat-c-analytics`
- `feature/chat-d-experiments`
- `feature/chat-e-frontend`
- `feature/chat-f-billing`
- `feature/integration`

## Dependency-safe start order for chats B–F

The M01 contracts are already in `packages/shared`, so these chats can start without waiting for each other's implementations. They still must not edit the schema.

1. Chat B — provider adapters, monitoring jobs, and worker execution. Later chats read observations; they should not block on B if they program to the observation contract.
2. Chat C — analytics and audits against the observation and audit contracts. Do not calculate metrics from mock provider text.
3. Chat D — experiment linkage and uncertainty against immutable observation ids.
4. Chat E — screens and report rendering against the documented API. Empty states stay empty until real data exists.
5. Chat F — billing, quotas, and infrastructure. Entitlement keys are already named. Do not charge a card in development.

Chat G reviews the contracts and merges after each chat's acceptance evidence is attached. Chat A remains available for schema changes; those changes land before the chats that need the new columns.

## Contract-change request

Copy `docs/tasks/task-template.md`. State the current schema or Zod object, the proposed change, who consumes it, and the migration safety check. Chat A applies schema edits. Nobody else edits `schema.prisma` in parallel.
