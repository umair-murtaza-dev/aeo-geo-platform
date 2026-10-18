import { z } from 'zod';
import { decimalStringSchema, isoDateTimeSchema, uuidSchema } from './common';

export const experimentStatusSchema = z.enum(['DRAFT', 'RUNNING', 'COMPLETED', 'CANCELLED']);
export const cohortRoleSchema = z.enum(['BASELINE', 'CONTROL', 'TREATMENT']);

export const experimentSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  brandId: uuidSchema,
  name: z.string(),
  hypothesis: z.string().nullable(),
  status: experimentStatusSchema,
  startedAt: isoDateTimeSchema.nullable(),
  endedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createExperimentRequestSchema = z
  .object({
    brandId: uuidSchema,
    name: z.string().trim().min(1).max(160),
    hypothesis: z.string().trim().min(1).max(4000).optional(),
  })
  .strict();

export const experimentInterventionSchema = z.object({
  id: uuidSchema,
  experimentId: uuidSchema,
  organizationId: uuidSchema,
  title: z.string(),
  description: z.string().nullable(),
  appliedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const experimentCohortSchema = z.object({
  id: uuidSchema,
  experimentId: uuidSchema,
  organizationId: uuidSchema,
  role: cohortRoleSchema,
  name: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const experimentResultSchema = z.object({
  id: uuidSchema,
  experimentId: uuidSchema,
  organizationId: uuidSchema,
  metric: z.string(),
  estimate: decimalStringSchema,
  lowerBound: decimalStringSchema.nullable(),
  upperBound: decimalStringSchema.nullable(),
  confidenceLevel: decimalStringSchema.nullable(),
  computedAt: isoDateTimeSchema,
  createdAt: isoDateTimeSchema,
});

export const exampleCreateExperimentRequest = {
  brandId: '44444444-4444-4444-8444-444444444444',
  name: 'Homepage citation test',
  hypothesis: 'Adding explicit entity markup increases brand citations.',
};
