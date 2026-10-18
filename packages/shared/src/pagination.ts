import { z } from 'zod';
import { AppError } from './errors';

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.uuid().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const sortDirectionSchema = z.enum(['asc', 'desc']);
export type SortDirection = z.infer<typeof sortDirectionSchema>;

export interface SortSpec {
  field: string;
  direction: SortDirection;
}

/**
 * Sort fields are an allow-list per endpoint. `createdAt:desc` is the conventional form.
 * Unknown fields fail validation instead of being ignored.
 */
export function parseSort(
  value: string | undefined,
  allowed: readonly string[],
  fallback: SortSpec,
): SortSpec {
  if (!value) return fallback;
  const [field, direction = 'asc'] = value.split(':');
  if (!field || !allowed.includes(field) || (direction !== 'asc' && direction !== 'desc')) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Unsupported sort');
  }
  return { field, direction };
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
