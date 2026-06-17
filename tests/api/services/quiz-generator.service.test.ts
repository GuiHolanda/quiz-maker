import { QuizGeneratorService } from '@/features/services/quiz-generator.service';

const service = new QuizGeneratorService();

function makeTopic(name: string, min: number, max: number) {
  return { name, minQuestions: min, maxQuestions: max };
}

function sumAllocation(result: Map<string, number>): number {
  return Array.from(result.values()).reduce((a, b) => a + b, 0);
}

describe('QuizGeneratorService.distributeQuestions', () => {
  it('throws when total is 0', () => {
    const topics = [makeTopic('A', 0.1, 0.5)];
    expect(() => service.distributeQuestions(topics, 0)).toThrow('numQuestions must be > 0');
  });

  it('throws when total is negative', () => {
    const topics = [makeTopic('A', 0.1, 0.5)];
    expect(() => service.distributeQuestions(topics, -1)).toThrow('numQuestions must be > 0');
  });

  it('throws when topics array is empty', () => {
    expect(() => service.distributeQuestions([], 10)).toThrow('Certification has no topics');
  });

  it('exact distribution — 3 equal topics with total=10 sums to 10', () => {
    const topics = [
      makeTopic('A', 0.1, 0.4),
      makeTopic('B', 0.1, 0.4),
      makeTopic('C', 0.1, 0.4),
    ];
    const result = service.distributeQuestions(topics, 10);
    expect(sumAllocation(result)).toBe(10);
  });

  it('respects minQuestions — no topic gets fewer than Math.floor(min * total)', () => {
    const topics = [
      makeTopic('A', 0.2, 0.5),
      makeTopic('B', 0.3, 0.5),
      makeTopic('C', 0.1, 0.4),
    ];
    const total = 10;
    const result = service.distributeQuestions(topics, total);
    for (const t of topics) {
      const minCount = Math.floor(t.minQuestions * total);
      const actual = result.get(t.name) ?? 0;
      expect(actual).toBeGreaterThanOrEqual(minCount);
    }
  });

  it('respects maxQuestions — no topic gets more than Math.ceil(max * total) unless overflow is needed', () => {
    const topics = [
      makeTopic('A', 0.2, 0.4),
      makeTopic('B', 0.3, 0.4),
      makeTopic('C', 0.1, 0.3),
    ];
    const total = 10;
    const result = service.distributeQuestions(topics, total);
    for (const t of topics) {
      const maxCount = Math.ceil(t.maxQuestions * total);
      const actual = result.get(t.name) ?? 0;
      expect(actual).toBeLessThanOrEqual(maxCount);
    }
  });

  it('uneven remainder — 2 symmetric topics with total=7 sums to 7 and each gets at least its minimum', () => {
    const topics = [
      makeTopic('A', 0.3, 0.5),
      makeTopic('B', 0.3, 0.5),
    ];
    const total = 7;
    const result = service.distributeQuestions(topics, total);
    expect(sumAllocation(result)).toBe(total);
    for (const t of topics) {
      const minCount = Math.floor(t.minQuestions * total);
      const actual = result.get(t.name) ?? 0;
      expect(actual).toBeGreaterThanOrEqual(minCount);
    }
  });

  it('single topic — gets all questions regardless of min/max', () => {
    const topics = [makeTopic('Solo', 0.1, 1.0)];
    const total = 5;
    const result = service.distributeQuestions(topics, total);
    expect(result.get('Solo')).toBe(total);
    expect(sumAllocation(result)).toBe(total);
  });

  it('topics that receive 0 questions are removed from the result map', () => {
    // A topic with a very low max relative to total that might get 0 allocation
    // min=0.0 and max=0.0 forces 0 count and should be removed
    const topics = [
      makeTopic('Active', 0.5, 1.0),
      makeTopic('Inactive', 0.0, 0.0),
    ];
    const total = 4;
    const result = service.distributeQuestions(topics, total);
    expect(result.has('Inactive')).toBe(false);
    expect(result.has('Active')).toBe(true);
  });
});
