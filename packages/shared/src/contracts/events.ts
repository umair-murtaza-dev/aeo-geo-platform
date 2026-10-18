import { z } from 'zod';
import { isoDateTimeSchema, uuidSchema } from './common';
import { observationSurfaceSchema } from './monitoring';

const eventBase = {
  id: uuidSchema,
  occurredAt: isoDateTimeSchema,
  organizationId: uuidSchema.nullable(),
};

export const domainEventSchema = z.discriminatedUnion('type', [
  z.object({
    ...eventBase,
    type: z.literal('organization.created'),
    actorUserId: uuidSchema,
    entityId: uuidSchema,
  }),
  z.object({
    ...eventBase,
    type: z.literal('monitoring.run.queued'),
    runId: uuidSchema,
    idempotencyKey: z.string(),
  }),
  z.object({
    ...eventBase,
    type: z.literal('observation.recorded'),
    observationId: uuidSchema,
    surface: observationSurfaceSchema,
  }),
  z.object({
    ...eventBase,
    type: z.literal('experiment.result.computed'),
    experimentId: uuidSchema,
    resultId: uuidSchema,
  }),
  z.object({
    ...eventBase,
    type: z.literal('billing.event.recorded'),
    billingEventId: uuidSchema,
  }),
]);

export type DomainEvent = z.infer<typeof domainEventSchema>;

export const exampleDomainEvent = {
  id: '88888888-8888-4888-8888-888888888888',
  occurredAt: '2026-10-18T12:00:00.000Z',
  organizationId: '11111111-1111-4111-8111-111111111111',
  type: 'monitoring.run.queued' as const,
  runId: '33333333-3333-4333-8333-333333333333',
  idempotencyKey: 'run-33333333-3333-4333-8333-333333333333',
};
