import { describe, expect, it } from 'vitest';
import { VISIBILITY_METRICS, calculateVisibilityMetrics } from './index';

describe('analytics scaffold', () => {
  it('publishes metric definitions and does not calculate them', () => {
    expect(VISIBILITY_METRICS.map((metric) => metric.key)).toContain('mention_rate');
    expect(() => calculateVisibilityMetrics()).toThrow(/NOT_IMPLEMENTED|deferred/i);
  });
});
