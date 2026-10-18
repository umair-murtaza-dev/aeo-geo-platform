import { z } from 'zod';
import { decimalStringSchema, isoDateTimeSchema, uuidSchema } from './common';

/**
 * Metric definitions only. M01 does not calculate values from observations.
 * Rates are ratios in the closed interval [0, 1], serialized as decimal strings.
 */
export const VISIBILITY_METRICS = [
  {
    key: 'mention_rate',
    description: 'Share of observations in which the brand was mentioned.',
    unit: 'ratio',
  },
  {
    key: 'citation_rate',
    description: 'Share of observations that cited one of the brand domains.',
    unit: 'ratio',
  },
  {
    key: 'competitor_mention_rate',
    description: 'Share of observations that mentioned a tracked competitor.',
    unit: 'ratio',
  },
  {
    key: 'share_of_voice',
    description: 'Brand mentions divided by brand plus competitor mentions.',
    unit: 'ratio',
  },
  {
    key: 'observation_count',
    description: 'Count of immutable observations in the selected window.',
    unit: 'count',
  },
] as const;

export const visibilityMetricKeySchema = z.enum(
  VISIBILITY_METRICS.map((metric) => metric.key) as [
    (typeof VISIBILITY_METRICS)[number]['key'],
    ...(typeof VISIBILITY_METRICS)[number]['key'][],
  ],
);

export const visibilityQuerySchema = z
  .object({
    brandId: uuidSchema,
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
    surface: z.enum(['MODEL_API', 'GROUNDED_SEARCH', 'CONSUMER_SEARCH']).optional(),
  })
  .strict();

export const visibilityMetricPointSchema = z.object({
  metric: visibilityMetricKeySchema,
  value: decimalStringSchema,
  sampleSize: z.number().int().nonnegative(),
  from: isoDateTimeSchema,
  to: isoDateTimeSchema,
});

export const exampleVisibilityQuery = {
  brandId: '44444444-4444-4444-8444-444444444444',
  from: '2026-10-01T00:00:00.000Z',
  to: '2026-10-18T00:00:00.000Z',
};
