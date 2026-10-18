import { describe, expect, it } from 'vitest';
import { COHORT_ROLES, compareCohorts } from './index';

describe('experiments scaffold', () => {
  it('names the cohort roles and does not estimate effects', () => {
    expect(COHORT_ROLES).toEqual(['BASELINE', 'CONTROL', 'TREATMENT']);
    expect(() => compareCohorts()).toThrow(/deferred/i);
  });
});
