import { z } from 'zod';
import { currencyCodeSchema, isoDateTimeSchema, uuidSchema } from './common';

export const subscriptionStatusSchema = z.enum([
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'INCOMPLETE',
]);

export const planSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  currency: currencyCodeSchema,
  amountMinor: z.number().int().nonnegative(),
  interval: z.enum(['month', 'year']),
  active: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const entitlementSchema = z.object({
  id: uuidSchema,
  planId: uuidSchema,
  key: z.string(),
  limitInt: z.number().int().nonnegative().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const subscriptionSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  planId: uuidSchema,
  status: subscriptionStatusSchema,
  currency: currencyCodeSchema,
  currentPeriodStart: isoDateTimeSchema.nullable(),
  currentPeriodEnd: isoDateTimeSchema.nullable(),
  stripeCustomerRef: z.string().nullable(),
  stripeSubscriptionRef: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const usageRecordSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  metric: z.string(),
  quantity: z.string().regex(/^\d+(\.\d{1,6})?$/),
  unit: z.string(),
  occurredAt: isoDateTimeSchema,
  sourceType: z.string().nullable(),
  sourceId: z.string().nullable(),
  createdAt: isoDateTimeSchema,
});

export const billingEventSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  type: z.string(),
  amountMinor: z.number().int().nullable(),
  currency: currencyCodeSchema.nullable(),
  externalRef: z.string().nullable(),
  occurredAt: isoDateTimeSchema,
  createdAt: isoDateTimeSchema,
});

export const ENTITLEMENT_KEYS = [
  'monitoring_runs_per_month',
  'workspaces',
  'brands',
  'seats',
  'report_exports_per_month',
] as const;

export const entitlementKeySchema = z.enum(ENTITLEMENT_KEYS);

export const examplePlan = {
  id: '77777777-7777-4777-8777-777777777777',
  code: 'agency_starter',
  name: 'Agency Starter',
  description: 'Placeholder plan definition. Billing is not activated in M01.',
  currency: 'USD',
  amountMinor: 9900,
  interval: 'month' as const,
  active: false,
  createdAt: '2026-10-18T00:00:00.000Z',
  updatedAt: '2026-10-18T00:00:00.000Z',
};
