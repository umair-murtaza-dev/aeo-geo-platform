# API contracts

Base path: `/api/v1`.

Success responses:

```json
{ "ok": true, "data": {}, "requestId": "req_example" }
```

Error responses:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "requestId": "req_example",
    "details": [{ "path": "email", "message": "Invalid email" }]
  }
}
```

Error codes are `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `TENANT_FORBIDDEN`, `WORKSPACE_FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `NOT_IMPLEMENTED`, `SERVICE_UNAVAILABLE`, and `INTERNAL_ERROR`.

Pagination query: `limit` from 1 to 100, default 20, and an optional UUID `cursor`. List data is `{ "items": [], "nextCursor": null }`.

Sort, when an endpoint allows it, is `field:asc` or `field:desc`. Unknown fields are validation errors. M01 list endpoints do not accept a generic filter language.

Timestamps are ISO-8601 UTC. Money in billing contracts is integer `amountMinor` plus `currency`. Decimal measurements are strings.

Zod schemas live in `packages/shared/src/contracts`. Example objects in those files are fixtures for tests, not live API responses.

## Implemented in M01

| Method | Path | Schema |
| --- | --- | --- |
| GET | `/api/v1/health` | Liveness. No dependency checks. |
| GET | `/api/v1/ready` | Database `up`, `down`, or `not_configured`. |
| GET | `/api/v1` | Lists implemented routes only. |
| POST | `/api/v1/auth/register` | `registerRequestSchema` |
| POST | `/api/v1/auth/login` | `loginRequestSchema` → bearer token |
| GET | `/api/v1/me` | `sessionResponseSchema` |
| GET | `/api/v1/organizations` | Page of `organizationSchema` for the caller |
| POST | `/api/v1/organizations` | `createOrganizationRequestSchema` |
| GET | `/api/v1/organizations/:organizationId` | `organizationSchema` |
| GET | `/api/v1/organizations/:organizationId/workspaces` | Page of `workspaceSchema` |

`GET /health` and `GET /ready` match the versioned health routes for load balancers.

Register example:

```json
{ "email": "owner@example.com", "password": "correct-horse-battery", "name": "Avery Owner" }
```

Create organization example:

```json
{ "name": "Northwind Agency", "slug": "northwind", "kind": "AGENCY" }
```

Login returns `tokenType`, `accessToken`, `expiresAt`, and `user`. The token is not an organization credential.

Unauthenticated calls to member routes return `401`. A member of another organization receives `404` for an organization they cannot access. The response does not echo that organization's name.

## Documented, not implemented

These routes are not registered. A request returns `404`. Do not treat that as a successful empty dataset.

| Area | Methods and paths | Request schema |
| --- | --- | --- |
| Memberships | `POST /organizations/:id/memberships`, `PATCH /memberships/:id` | role from `membershipRoleSchema` |
| Workspaces | `POST /organizations/:id/workspaces` | `createWorkspaceRequestSchema` |
| Brands | `POST /organizations/:id/brands`, `POST /brands/:id/domains` | `createBrandRequestSchema`, `createBrandDomainRequestSchema` |
| Competitors | `POST /brands/:id/competitors` | `createCompetitorRequestSchema` |
| Prompts | `POST /brands/:id/prompts`, `POST /prompts/:id/versions` | `createPromptRequestSchema` |
| Schedules and runs | `POST /prompts/:id/schedules`, `POST /runs` | `monitoringScheduleSchema` fields, idempotency key required |
| Observations | `GET /runs/:id/observations` | `aiObservationSchema` |
| Visibility | `GET /brands/:id/visibility` | `visibilityQuerySchema` |
| Audits | `POST /brands/:id/audits` | `createAuditJobRequestSchema` |
| Recommendations | `GET /brands/:id/recommendations`, `POST /recommendations/:id/tasks` | `recommendationSchema`, `implementationTaskSchema` |
| Experiments | `POST /brands/:id/experiments` | `createExperimentRequestSchema` |
| Reports | `POST /reports`, `POST /reports/:id/exports` | `createReportRequestSchema` |
| Billing | `GET /organizations/:id/subscription`, `GET /organizations/:id/usage` | `subscriptionSchema`, `usageRecordSchema` |

Visibility responses, when implemented, must be computed from stored observations. M01 has no endpoint for them.
