# Event contracts

M01 does not run an event bus. Workers consume BullMQ jobs. Domain events below are the names later milestones should emit. Payloads are validated by `domainEventSchema` in `@aeo/shared`.

| Type | When it will be emitted | Required fields |
| --- | --- | --- |
| `organization.created` | An organization row is committed | `actorUserId`, `entityId` |
| `monitoring.run.queued` | A run is accepted onto the monitoring queue | `runId`, `idempotencyKey` |
| `observation.recorded` | An immutable observation is inserted | `observationId`, `surface` |
| `experiment.result.computed` | A new result row is inserted | `experimentId`, `resultId` |
| `billing.event.recorded` | A billing event row is inserted | `billingEventId` |

Every event has `id`, `occurredAt`, and `organizationId` (`null` only for platform-scoped events such as registration).

BullMQ queue names:

- `system.ping` — harmless readiness job
- `monitoring.execute` — payload `monitoringExecuteJobSchema`

Job options use the idempotency key as the BullMQ job id, 3 attempts, and exponential backoff starting at 2 seconds. Invalid payloads raise `UnrecoverableError` and are not retried. A duplicate job id is treated as `duplicate` rather than a second execution.

`system.ping` concurrency is 5. `monitoring.execute` concurrency is 2. The monitoring handler does not call a provider in M01.
