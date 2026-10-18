import { z } from 'zod';
import {
  isoDateTimeSchema,
  membershipRoleSchema,
  organizationKindSchema,
  slugSchema,
  uuidSchema,
} from './common';

export const organizationSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(120),
  slug: slugSchema,
  kind: organizationKindSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const organizationMembershipSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  userId: uuidSchema,
  role: membershipRoleSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createOrganizationRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    slug: slugSchema,
    kind: organizationKindSchema,
  })
  .strict();

export const workspaceSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  name: z.string(),
  slug: slugSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createWorkspaceRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    slug: slugSchema,
  })
  .strict();

export const brandSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  workspaceId: uuidSchema,
  name: z.string(),
  slug: slugSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createBrandRequestSchema = z
  .object({
    workspaceId: uuidSchema,
    name: z.string().trim().min(1).max(120),
    slug: slugSchema,
  })
  .strict();

export const brandDomainSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  brandId: uuidSchema,
  hostname: z.string().regex(/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/),
  isPrimary: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createBrandDomainRequestSchema = z
  .object({
    hostname: brandDomainSchema.shape.hostname,
    isPrimary: z.boolean().default(false),
  })
  .strict();

export const brandLocationSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  brandId: uuidSchema,
  name: z.string(),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  region: z.string().nullable(),
  city: z.string().nullable(),
  locale: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/).nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const competitorSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  brandId: uuidSchema,
  name: z.string(),
  domain: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createCompetitorRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    domain: z.string().trim().min(1).max(253).nullable().optional(),
  })
  .strict();

export const exampleCreateOrganizationRequest = {
  name: 'Northwind Agency',
  slug: 'northwind',
  kind: 'AGENCY' as const,
};

export const exampleOrganization = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Northwind Agency',
  slug: 'northwind',
  kind: 'AGENCY' as const,
  createdAt: '2026-10-18T00:00:00.000Z',
  updatedAt: '2026-10-18T00:00:00.000Z',
};
