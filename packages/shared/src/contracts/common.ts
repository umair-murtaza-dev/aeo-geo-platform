import { z } from 'zod';
import { API_ERROR_CODES } from '../errors';
import { MEMBERSHIP_ROLES, PERMISSIONS, PLATFORM_ROLES } from '../permissions';

export const uuidSchema = z.uuid();
export const emailSchema = z
  .email()
  .transform((value) => value.trim().toLowerCase());
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .min(2)
  .max(64);
export const passwordSchema = z.string().min(12).max(128);
export const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);
export const decimalStringSchema = z.string().regex(/^-?\d+(\.\d{1,6})?$/);
export const isoDateTimeSchema = z.iso.datetime();
export const localeSchema = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/);
export const countryCodeSchema = z.string().regex(/^[A-Z]{2}$/);

export const membershipRoleSchema = z.enum(MEMBERSHIP_ROLES);
export const platformRoleSchema = z.enum(PLATFORM_ROLES);
export const permissionSchema = z.enum(PERMISSIONS);
export const organizationKindSchema = z.enum(['AGENCY', 'BUSINESS']);

export const apiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.enum(API_ERROR_CODES),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.unknown().optional(),
  }),
});

export function successSchema<T extends z.ZodType>(data: T) {
  return z.object({
    ok: z.literal(true),
    data,
    requestId: z.string(),
  });
}

export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: uuidSchema.nullable(),
  });

export const principalSchema = z.object({
  userId: uuidSchema,
  email: z.email(),
  name: z.string().nullable(),
  platformRole: platformRoleSchema,
});

export type Principal = z.infer<typeof principalSchema>;

export const tenantContextSchema = z.object({
  userId: uuidSchema,
  organizationId: uuidSchema,
  workspaceId: uuidSchema.nullable(),
  role: z.union([membershipRoleSchema, z.literal('PLATFORM_ADMIN')]),
  permissions: z.array(permissionSchema),
});

export type TenantContext = z.infer<typeof tenantContextSchema>;
