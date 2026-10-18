import { z } from 'zod';
import {
  currencyCodeSchema,
  decimalStringSchema,
  isoDateTimeSchema,
  localeSchema,
  uuidSchema,
} from './common';

export const OBSERVATION_SURFACES = ['MODEL_API', 'GROUNDED_SEARCH', 'CONSUMER_SEARCH'] as const;
export const observationSurfaceSchema = z.enum(OBSERVATION_SURFACES);
export type ObservationSurface = z.infer<typeof observationSurfaceSchema>;

export const promptStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);
export const scheduleCadenceSchema = z.enum(['MANUAL', 'HOURLY', 'DAILY', 'WEEKLY']);
export const runStatusSchema = z.enum(['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED']);
export const executionStatusSchema = z.enum(['SUCCEEDED', 'FAILED', 'PARTIAL']);

export const monitoringPromptSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  brandId: uuidSchema,
  title: z.string(),
  slug: z.string(),
  status: promptStatusSchema,
  currentVersionId: uuidSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createPromptRequestSchema = z
  .object({
    brandId: uuidSchema,
    title: z.string().trim().min(1).max(160),
    slug: z.string().trim().min(1).max(80),
    body: z.string().trim().min(1).max(8000),
  })
  .strict();

export const promptVersionSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  promptId: uuidSchema,
  version: z.number().int().positive(),
  body: z.string(),
  createdByUserId: uuidSchema.nullable(),
  createdAt: isoDateTimeSchema,
});

export const monitoringScheduleSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  promptId: uuidSchema,
  brandId: uuidSchema,
  cadence: scheduleCadenceSchema,
  timezone: z.string(),
  locale: localeSchema.nullable(),
  providerId: z.string().nullable(),
  surface: observationSurfaceSchema.nullable(),
  engineId: z.string().nullable(),
  enabled: z.boolean(),
  nextRunAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const monitoringRunSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  scheduleId: uuidSchema.nullable(),
  promptVersionId: uuidSchema,
  brandId: uuidSchema,
  status: runStatusSchema,
  idempotencyKey: z.string().min(1).max(200),
  providerId: z.string().nullable(),
  surface: observationSurfaceSchema.nullable(),
  engineId: z.string().nullable(),
  locale: localeSchema.nullable(),
  scheduledFor: isoDateTimeSchema.nullable(),
  startedAt: isoDateTimeSchema.nullable(),
  finishedAt: isoDateTimeSchema.nullable(),
  errorCode: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const citationSchema = z.object({
  id: uuidSchema,
  observationId: uuidSchema,
  url: z.url(),
  title: z.string().nullable(),
  domain: z.string().nullable(),
  position: z.number().int().positive().nullable(),
  createdAt: isoDateTimeSchema,
});

export const brandMentionSchema = z.object({
  id: uuidSchema,
  observationId: uuidSchema,
  brandId: uuidSchema.nullable(),
  competitorId: uuidSchema.nullable(),
  mentioned: z.boolean(),
  excerpt: z.string().nullable(),
  position: z.number().int().positive().nullable(),
  createdAt: isoDateTimeSchema,
});

export const aiObservationSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  runId: uuidSchema,
  brandId: uuidSchema,
  providerId: z.string(),
  surface: observationSurfaceSchema,
  engineId: z.string(),
  locale: localeSchema.nullable(),
  market: z.string().nullable(),
  executedAt: isoDateTimeSchema,
  status: executionStatusSchema,
  promptVersionId: uuidSchema,
  rawResponseRef: z.string().nullable(),
  rawResponseSha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  totalTokens: z.number().int().nonnegative().nullable(),
  estimatedCostAmount: decimalStringSchema.nullable(),
  estimatedCostCurrency: currencyCodeSchema.nullable(),
  actualCostAmount: decimalStringSchema.nullable(),
  actualCostCurrency: currencyCodeSchema.nullable(),
  latencyMs: z.number().int().nonnegative().nullable(),
  createdAt: isoDateTimeSchema,
});

export const QUEUE_NAMES = {
  systemPing: 'system.ping',
  monitoringExecute: 'monitoring.execute',
} as const;

export const pingJobSchema = z.object({
  requestedAt: isoDateTimeSchema,
}).strict();

export const monitoringExecuteJobSchema = z
  .object({
    organizationId: uuidSchema,
    runId: uuidSchema,
    idempotencyKey: z.string().min(8).max(200),
  })
  .strict();

export const exampleObservation = {
  id: '22222222-2222-4222-8222-222222222222',
  organizationId: '11111111-1111-4111-8111-111111111111',
  runId: '33333333-3333-4333-8333-333333333333',
  brandId: '44444444-4444-4444-8444-444444444444',
  providerId: 'example-provider',
  surface: 'CONSUMER_SEARCH' as const,
  engineId: 'example-search',
  locale: 'en-US',
  market: 'US',
  executedAt: '2026-10-18T12:00:00.000Z',
  status: 'SUCCEEDED' as const,
  promptVersionId: '55555555-5555-4555-8555-555555555555',
  rawResponseRef: 's3://aeo-observations/example/object',
  rawResponseSha256: 'a'.repeat(64),
  inputTokens: 120,
  outputTokens: 80,
  totalTokens: 200,
  estimatedCostAmount: '0.002100',
  estimatedCostCurrency: 'USD',
  actualCostAmount: null,
  actualCostCurrency: null,
  latencyMs: 840,
  createdAt: '2026-10-18T12:00:01.000Z',
};
