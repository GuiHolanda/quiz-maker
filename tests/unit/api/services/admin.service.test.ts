import { percentile } from '@/app/api/admin/admin.service';

// Regression coverage for the P90-consumo column added to /admin/analytics (pricing tier
// audit, semana 2-3): the break-even comparison is only meaningful if the underlying
// nearest-rank percentile math is correct at its edges.
describe('percentile', () => {
  it('returns 0 for an empty array', () => {
    expect(percentile([], 90)).toBe(0);
  });

  it('returns the single value regardless of requested percentile', () => {
    expect(percentile([42], 50)).toBe(42);
    expect(percentile([42], 90)).toBe(42);
  });

  it('computes p50/p90/p100 via nearest-rank on a sorted array', () => {
    const sorted = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    expect(percentile(sorted, 50)).toBe(50);
    expect(percentile(sorted, 90)).toBe(90);
    expect(percentile(sorted, 100)).toBe(100);
  });

  it('never indexes past the end of the array', () => {
    expect(percentile([5, 15], 100)).toBe(15);
  });

  it('assumes the input is already sorted ascending — does not sort internally', () => {
    // Guards the call site's contract: callers must sort before calling.
    expect(percentile([100, 10], 50)).toBe(100);
  });
});
