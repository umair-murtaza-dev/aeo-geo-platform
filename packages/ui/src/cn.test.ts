import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins class names and drops false values', () => {
    expect(cn('px-2', false, 'text-sm')).toBe('px-2 text-sm');
  });
});
