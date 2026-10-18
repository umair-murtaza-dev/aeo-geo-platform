import { AppError, VISIBILITY_METRICS } from '@aeo/shared';

export const MODULE = '@aeo/analytics';
export { VISIBILITY_METRICS };

export function calculateVisibilityMetrics(): never {
  throw new AppError(
    501,
    'NOT_IMPLEMENTED',
    'Visibility calculations are deferred until a later milestone.',
  );
}
