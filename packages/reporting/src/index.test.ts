import { describe, expect, it } from 'vitest';
import { REPORT_FORMATS, renderReport } from './index';

describe('reporting scaffold', () => {
  it('lists export formats and does not render a report', () => {
    expect(REPORT_FORMATS).toEqual(['PDF', 'CSV']);
    expect(() => renderReport()).toThrow(/deferred/i);
  });
});
