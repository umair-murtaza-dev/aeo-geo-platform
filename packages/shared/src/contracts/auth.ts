import { z } from 'zod';
import { emailSchema, passwordSchema, platformRoleSchema, uuidSchema } from './common';
import { membershipRoleSchema, permissionSchema } from './common';

export const registerRequestSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const loginRequestSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const publicUserSchema = z.object({
  id: uuidSchema,
  email: z.email(),
  name: z.string().nullable(),
  platformRole: platformRoleSchema,
  createdAt: z.iso.datetime(),
});

export const accessTokenResponseSchema = z.object({
  tokenType: z.literal('Bearer'),
  accessToken: z.string().min(1),
  expiresAt: z.iso.datetime(),
  user: publicUserSchema,
});

export const membershipSummarySchema = z.object({
  organizationId: uuidSchema,
  organizationName: z.string(),
  organizationSlug: z.string(),
  role: membershipRoleSchema,
  permissions: z.array(permissionSchema),
});

export const sessionResponseSchema = z.object({
  user: publicUserSchema,
  memberships: z.array(membershipSummarySchema),
  platformPermissions: z.array(permissionSchema),
});

export const exampleRegisterRequest = {
  email: 'owner@example.com',
  password: 'correct-horse-battery',
  name: 'Avery Owner',
};

export const exampleLoginRequest = {
  email: 'owner@example.com',
  password: 'correct-horse-battery',
};
