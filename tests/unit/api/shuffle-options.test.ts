import { shuffleItems, shuffleOptionTexts } from '@/lib/shuffle-options';

describe('shuffleOptionTexts', () => {
  it('keeps the same label set', () => {
    const result = shuffleOptionTexts({ A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' });

    expect(Object.keys(result).sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('keeps the same option texts, only reassigned', () => {
    const result = shuffleOptionTexts({ A: 'a', B: 'b', C: 'c', D: 'd' });

    expect(Object.values(result).sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('reassigns texts according to the supplied randomness', () => {
    // Fisher-Yates walks i from last to first; returning 0 every draw swaps each
    // position with index 0, which rotates the list to a known permutation.
    const result = shuffleOptionTexts({ A: 'a', B: 'b', C: 'c' }, () => 0);

    expect(result).toEqual({ A: 'b', B: 'c', C: 'a' });
  });

  it('does not mutate the input', () => {
    const input = { A: 'a', B: 'b', C: 'c' };

    shuffleOptionTexts(input, () => 0);

    expect(input).toEqual({ A: 'a', B: 'b', C: 'c' });
  });

  it('moves the correct answer off A across repeated draws', () => {
    // The regression itself: the drafting LLM emits the correct text under A, so a
    // question persisted verbatim is answerable by always picking A.
    const positions = new Set<string>();

    for (let run = 0; run < 200; run++) {
      const result = shuffleOptionTexts({ A: 'correct', B: 'w1', C: 'w2', D: 'w3', E: 'w4' });
      const label = Object.keys(result).find((key) => result[key] === 'correct');

      positions.add(label as string);
    }

    expect(positions.size).toBeGreaterThan(1);
  });

  it('handles a single option and an empty set', () => {
    expect(shuffleOptionTexts({ A: 'only' })).toEqual({ A: 'only' });
    expect(shuffleOptionTexts({})).toEqual({});
  });
});

describe('shuffleItems', () => {
  it('returns a new array with the same members', () => {
    const input = [1, 2, 3, 4];
    const result = shuffleItems(input);

    expect(result).not.toBe(input);
    expect([...result].sort()).toEqual([1, 2, 3, 4]);
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3];

    shuffleItems(input, () => 0);

    expect(input).toEqual([1, 2, 3]);
  });
});
