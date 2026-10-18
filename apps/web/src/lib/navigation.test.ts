import { describe, expect, it } from 'vitest';
import { foundationCopy, primaryNavigation } from './navigation';

describe('foundation copy', () => {
  it('exposes navigation and does not invent visibility numbers', () => {
    expect(primaryNavigation.map((item) => item.href)).toEqual(['/', '/dashboard', '/login']);
    expect(foundationCopy.empty.toLowerCase()).toContain('no sample metrics');
    expect(foundationCopy.summary).not.toMatch(/\d+%/);
  });
});
