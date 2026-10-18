import { describe, expect, it } from 'vitest';
import { parseSort } from '../pagination';
import { formatUtc } from '../time';
import { exampleLoginRequest, exampleRegisterRequest, loginRequestSchema, registerRequestSchema } from './auth';
import { examplePlan, planSchema } from './billing';
import { exampleCreateOrganizationRequest, createOrganizationRequestSchema, exampleOrganization, organizationSchema } from './tenancy';
import { exampleObservation, aiObservationSchema, monitoringExecuteJobSchema } from './monitoring';
import { exampleVisibilityQuery, visibilityQuerySchema } from './analytics';
import { exampleCreateAuditRequest, createAuditJobRequestSchema } from './audits';
import { exampleCreateExperimentRequest, createExperimentRequestSchema } from './experiments';
import { exampleCreateReportRequest, createReportRequestSchema } from './reports';
import { exampleDomainEvent, domainEventSchema } from './events';
import { AppError, sanitizeErrorMessage } from '../errors';

describe('contract examples', () => {
  it('parses documented request and response examples', () => {
    expect(registerRequestSchema.parse(exampleRegisterRequest).email).toBe('owner@example.com');
    expect(loginRequestSchema.parse(exampleLoginRequest).email).toBe('owner@example.com');
    expect(createOrganizationRequestSchema.parse(exampleCreateOrganizationRequest).kind).toBe('AGENCY');
    expect(organizationSchema.parse(exampleOrganization).slug).toBe('northwind');
    expect(aiObservationSchema.parse(exampleObservation).surface).toBe('CONSUMER_SEARCH');
    expect(visibilityQuerySchema.parse(exampleVisibilityQuery).brandId).toBe(exampleVisibilityQuery.brandId);
    expect(createAuditJobRequestSchema.parse(exampleCreateAuditRequest).brandId).toBeTruthy();
    expect(createExperimentRequestSchema.parse(exampleCreateExperimentRequest).name).toContain('citation');
    expect(createReportRequestSchema.parse(exampleCreateReportRequest).title).toContain('briefing');
    expect(planSchema.parse(examplePlan).amountMinor).toBe(9900);
    expect(domainEventSchema.parse(exampleDomainEvent).type).toBe('monitoring.run.queued');
    expect(
      monitoringExecuteJobSchema.parse({
        organizationId: exampleOrganization.id,
        runId: exampleObservation.runId,
        idempotencyKey: 'run-key-12345678',
      }).idempotencyKey,
    ).toBe('run-key-12345678');
  });

  it('rejects unknown fields on register so platform role cannot be self-assigned', () => {
    expect(() =>
      registerRequestSchema.parse({
        ...exampleRegisterRequest,
        platformRole: 'PLATFORM_ADMIN',
      }),
    ).toThrow();
  });

  it('normalizes email case', () => {
    expect(registerRequestSchema.parse({ ...exampleRegisterRequest, email: 'Owner@Example.com' }).email).toBe(
      'owner@example.com',
    );
  });
});

describe('pagination and time', () => {
  it('formats timestamps in UTC', () => {
    expect(formatUtc(new Date('2026-10-18T12:00:00.000Z'))).toBe('2026-10-18T12:00:00.000Z');
  });

  it('rejects sorts outside the allow-list', () => {
    expect(parseSort(undefined, ['createdAt'], { field: 'createdAt', direction: 'desc' })).toEqual({
      field: 'createdAt',
      direction: 'desc',
    });
    expect(parseSort('createdAt:asc', ['createdAt'], { field: 'createdAt', direction: 'desc' }).direction).toBe(
      'asc',
    );
    expect(() => parseSort('password:asc', ['createdAt'], { field: 'createdAt', direction: 'desc' })).toThrow(
      AppError,
    );
  });
});

describe('sanitizeErrorMessage', () => {
  it('removes database URLs', () => {
    const sanitized = sanitizeErrorMessage(
      'connect failed postgres://user:supersecret@db.example/aeo',
    );
    expect(sanitized).not.toContain('supersecret');
    expect(sanitized).not.toContain('postgres://');
  });
});
