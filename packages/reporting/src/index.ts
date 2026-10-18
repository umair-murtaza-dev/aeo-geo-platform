import { AppError } from '@aeo/shared';

export const MODULE = '@aeo/reporting';
export const REPORT_FORMATS = ['PDF', 'CSV'] as const;

export function renderReport(): never {
  throw new AppError(501, 'NOT_IMPLEMENTED', 'Report rendering is deferred until a later milestone.');
}
