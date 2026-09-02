import { describe, it, expect } from 'vitest';

import { paginationRange } from '@/shared/components/ui/paginate';

describe('paginationRange', () => {
  it('first page starts at 1 and fills perPage', () => {
    expect(paginationRange(1, 10, 42)).toEqual({ from: 1, to: 10 });
  });

  it('last partial page stops at total', () => {
    expect(paginationRange(5, 10, 42)).toEqual({ from: 41, to: 42 });
  });

  it('a middle page is a clean window', () => {
    expect(paginationRange(3, 5, 12)).toEqual({ from: 11, to: 12 });
  });

  it('single short page runs from 1 to total', () => {
    expect(paginationRange(1, 10, 6)).toEqual({ from: 1, to: 6 });
  });

  it('empty result collapses to 0–0', () => {
    expect(paginationRange(1, 10, 0)).toEqual({ from: 0, to: 0 });
  });
});
