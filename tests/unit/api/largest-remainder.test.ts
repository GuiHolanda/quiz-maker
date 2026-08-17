import { distributeByWeight } from '@/lib/largest-remainder';

describe('distributeByWeight', () => {
  it('splits proportionally when capacity is not binding', () => {
    const result = distributeByWeight(
      [
        { key: 'a', weight: 50, capacity: 100 },
        { key: 'b', weight: 30, capacity: 100 },
        { key: 'c', weight: 20, capacity: 100 },
      ],
      10
    );

    expect(result).toEqual({ a: 5, b: 3, c: 2 });
  });

  it('always hands out the full total when capacity allows', () => {
    const result = distributeByWeight(
      [
        { key: 'a', weight: 33, capacity: 100 },
        { key: 'b', weight: 33, capacity: 100 },
        { key: 'c', weight: 34, capacity: 100 },
      ],
      10
    );

    expect(Object.values(result).reduce((sum, n) => sum + n, 0)).toBe(10);
  });

  it('never exceeds a slot capacity', () => {
    const result = distributeByWeight(
      [
        { key: 'a', weight: 90, capacity: 2 },
        { key: 'b', weight: 10, capacity: 100 },
      ],
      10
    );

    expect(result.a).toBe(2);
    expect(result.b).toBe(8);
  });

  it('caps at total capacity when demand exceeds supply', () => {
    const result = distributeByWeight(
      [
        { key: 'a', weight: 50, capacity: 2 },
        { key: 'b', weight: 50, capacity: 3 },
      ],
      10
    );

    expect(result).toEqual({ a: 2, b: 3 });
  });

  it('ignores slots with no capacity', () => {
    const result = distributeByWeight(
      [
        { key: 'a', weight: 50, capacity: 0 },
        { key: 'b', weight: 50, capacity: 100 },
      ],
      10
    );

    expect(result).toEqual({ a: 0, b: 10 });
  });

  it('splits evenly when weights carry no signal', () => {
    const result = distributeByWeight(
      [
        { key: 'a', weight: 0, capacity: 100 },
        { key: 'b', weight: 0, capacity: 100 },
      ],
      10
    );

    expect(result).toEqual({ a: 5, b: 5 });
  });

  it('returns zeros for a non-positive total', () => {
    const result = distributeByWeight([{ key: 'a', weight: 50, capacity: 10 }], 0);

    expect(result).toEqual({ a: 0 });
  });
});
