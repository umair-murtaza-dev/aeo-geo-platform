import { z } from 'zod';
import { isoDateTimeSchema, uuidSchema } from './common';

export const reportStatusSchema = z.enum(['DRAFT', 'READY', 'FAILED']);
export const exportStatusSchema = z.enum(['PENDING', 'READY', 'FAILED']);
export const reportFormatSchema = z.enum(['PDF', 'CSV']);

export const reportSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  workspaceId: uuidSchema,
  brandId: uuidSchema.nullable(),
  title: z.string(),
  status: reportStatusSchema,
  periodStart: isoDateTimeSchema.nullable(),
  periodEnd: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createReportRequestSchema = z
  .object({
    workspaceId: uuidSchema,
    brandId: uuidSchema.optional(),
    title: z.string().trim().min(1).max(160),
    periodStart: isoDateTimeSchema.optional(),
    periodEnd: isoDateTimeSchema.optional(),
  })
  .strict();

export const reportExportSchema = z.object({
  id: uuidSchema,
  reportId: uuidSchema,
  organizationId: uuidSchema,
  format: reportFormatSchema,
  storageRef: z.string().nullable(),
  status: exportStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const exampleCreateReportRequest = {
  workspaceId: '66666666-6666-4666-8666-666666666666',
  title: 'October visibility briefing',
  periodStart: '2026-10-01T00:00:00.000Z',
  periodEnd: '2026-10-31T23:59:59.000Z',
};
