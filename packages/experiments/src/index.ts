import { AppError } from '@aeo/shared';

export const MODULE = '@aeo/experiments';
export const COHORT_ROLES = ['BASELINE', 'CONTROL', 'TREATMENT'] as const;

export function compareCohorts(): never {
  throw new AppError(
    501,
    'NOT_IMPLEMENTED',
    'Experiment comparison and uncertainty analysis are deferred until a later milestone.',
  );
}
