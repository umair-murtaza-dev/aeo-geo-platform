import { z } from 'zod';
import { isoDateTimeSchema, uuidSchema } from './common';

export const auditJobStatusSchema = z.enum(['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED']);
export const findingSeveritySchema = z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const recommendationStatusSchema = z.enum(['OPEN', 'ACCEPTED', 'DISMISSED', 'IMPLEMENTED']);
export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']);

export const auditJobSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  brandId: uuidSchema,
  domainId: uuidSchema.nullable(),
  status: auditJobStatusSchema,
  startedAt: isoDateTimeSchema.nullable(),
  finishedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createAuditJobRequestSchema = z
  .object({
    brandId: uuidSchema,
    domainId: uuidSchema.optional(),
  })
  .strict();

export const auditFindingSchema = z.object({
  id: uuidSchema,
  auditJobId: uuidSchema,
  organizationId: uuidSchema,
  code: z.string(),
  severity: findingSeveritySchema,
  title: z.string(),
  detail: z.string().nullable(),
  evidenceRef: z.string().nullable(),
  createdAt: isoDateTimeSchema,
});

export const recommendationSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  brandId: uuidSchema,
  findingId: uuidSchema.nullable(),
  title: z.string(),
  body: z.string(),
  status: recommendationStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const implementationTaskSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  recommendationId: uuidSchema,
  title: z.string(),
  status: taskStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const exampleCreateAuditRequest = {
  brandId: '44444444-4444-4444-8444-444444444444',
};
