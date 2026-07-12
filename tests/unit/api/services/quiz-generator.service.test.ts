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
    const topics = [makeTopic('A', 10, 50)];
    expect(() => service.distributeQuestions(topics, 0)).toThrow('numQuestions must be > 0');
  });

  it('throws when total is negative', () => {
    const topics = [makeTopic('A', 10, 50)];
    expect(() => service.distributeQuestions(topics, -1)).toThrow('numQuestions must be > 0');
  });

  it('throws when topics array is empty', () => {
    expect(() => service.distributeQuestions([], 10)).toThrow('Certification has no topics');
  });

  it('exact distribution — 3 equal topics with total=10 sums to 10', () => {
    const topics = [
      makeTopic('A', 10, 40),
      makeTopic('B', 10, 40),
      makeTopic('C', 10, 40),
    ];
    const result = service.distributeQuestions(topics, 10);
    expect(sumAllocation(result)).toBe(10);
  });

  it('respects minQuestions — no topic gets fewer than Math.floor((min/100) * total)', () => {
    const topics = [
      makeTopic('A', 20, 50),
      makeTopic('B', 30, 50),
      makeTopic('C', 10, 40),
    ];
    const total = 10;
    const result = service.distributeQuestions(topics, total);
    for (const t of topics) {
      const minCount = Math.floor((t.minQuestions / 100) * total);
      const actual = result.get(t.name) ?? 0;
      expect(actual).toBeGreaterThanOrEqual(minCount);
    }
  });

  it('respects maxQuestions — no topic gets more than Math.ceil((max/100) * total) unless overflow is needed', () => {
    const topics = [
      makeTopic('A', 20, 40),
      makeTopic('B', 30, 40),
      makeTopic('C', 10, 30),
    ];
    const total = 10;
    const result = service.distributeQuestions(topics, total);
    for (const t of topics) {
      const maxCount = Math.ceil((t.maxQuestions / 100) * total);
      const actual = result.get(t.name) ?? 0;
      expect(actual).toBeLessThanOrEqual(maxCount);
    }
  });

  it('uneven remainder — 2 symmetric topics with total=7 sums to 7 and each gets at least its minimum', () => {
    const topics = [
      makeTopic('A', 30, 50),
      makeTopic('B', 30, 50),
    ];
    const total = 7;
    const result = service.distributeQuestions(topics, total);
    expect(sumAllocation(result)).toBe(total);
    for (const t of topics) {
      const minCount = Math.floor((t.minQuestions / 100) * total);
      const actual = result.get(t.name) ?? 0;
      expect(actual).toBeGreaterThanOrEqual(minCount);
    }
  });

  it('single topic — gets all questions regardless of min/max', () => {
    const topics = [makeTopic('Solo', 10, 100)];
    const total = 5;
    const result = service.distributeQuestions(topics, total);
    expect(result.get('Solo')).toBe(total);
    expect(sumAllocation(result)).toBe(total);
  });

  it('topics that receive 0 questions are removed from the result map', () => {
    // B has a small weight that gets crowded out: A absorbs all remaining after minimums
    // A: min=50→floor(1.5)=1, max=100→ceil(3)=3; B: min=0→0, max=10→ceil(0.3)=1
    // remaining after minimums = 3-1 = 2; A can absorb 2 more (up to 3), so A=3, B=0
    const topics = [
      makeTopic('A', 50, 100),
      makeTopic('B', 0, 10),
    ];
    const total = 3;
    const result = service.distributeQuestions(topics, total);
    expect(result.has('B')).toBe(false);
    expect(result.get('A')).toBe(3);
  });

  it('overflow bucket fires when sum(max) < 100 — result still sums to total and top topic exceeds its ceiling', () => {
    // A: min=20→2, max=40→4; B: min=20→2, max=40→4; sum(max)=80 < 100
    // After normal pass: A=4, B=4, remaining=2 → overflow adds 2 to sorted[0]
    const topics = [
      makeTopic('A', 20, 40),
      makeTopic('B', 20, 40),
    ];
    const total = 10;
    const result = service.distributeQuestions(topics, total);
    expect(sumAllocation(result)).toBe(10);
    const ceiling = Math.ceil((40 / 100) * total); // 4
    const overflowRecipient = [...topics].sort(
      (a, b) => Math.ceil((b.maxQuestions / 100) * total) - Math.ceil((a.maxQuestions / 100) * total)
    )[0].name;
    expect(result.get(overflowRecipient)).toBeGreaterThan(ceiling);
  });
});
