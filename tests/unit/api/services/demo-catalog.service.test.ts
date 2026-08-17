import { prismaMock } from '../__mocks__/prisma';
import { DemoCatalogService, isDemoEligible } from '@/features/services/demo-catalog.service';
import { DEMO_QUIZ_SIZE, DEMO_SLICE_MAX, DEMO_SLICE_MIN } from '@/config/constants';

function makeOptions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    label: String.fromCharCode(65 + i),
    text: `Option ${String.fromCharCode(65 + i)}`,
  }));
}

function makeQuestion(id: number, overrides: Record<string, any> = {}) {
  return {
    id,
    text: `Question ${id}`,
    options: makeOptions(4),
    answer: {
      correctOptions: ['A'],
      explanations: [{ label: 'A', text: 'Because A.' }],
    },
    ...overrides,
  };
}

function makeTemplate(overrides: Record<string, any> = {}) {
  return {
    id: 'tmpl-1',
    type: 'certification',
    name: 'AWS Certified Solutions Architect',
    providerId: 'prov-1',
    examBoardId: null,
    totalQuestions: 65,
    examDurationMinutes: 130,
    passingScore: 72,
    year: 2024,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    provider: { name: 'AWS', fullName: 'Amazon Web Services', logoUrl: 'https://logo.svg' },
    examBoard: null,
    sections: [
      { name: 'Design Resilient Architectures', minQuestions: 50 },
      { name: 'Design Secure Applications', minQuestions: 50 },
    ],
    ...overrides,
  };
}

function makePool(sectionName: string, questions: any[], overrides: Record<string, any> = {}) {
  return {
    type: 'certification',
    providerId: 'prov-1',
    examBoardId: null,
    sectionName,
    questions,
    ...overrides,
  };
}

// Enough questions per section that both sections clear the slice floor together.
function fullyStockedPools(perSection = 15) {
  return [
    makePool(
      'Design Resilient Architectures',
      Array.from({ length: perSection }, (_, i) => makeQuestion(i + 1))
    ),
    makePool(
      'Design Secure Applications',
      Array.from({ length: perSection }, (_, i) => makeQuestion(100 + i))
    ),
  ];
}

describe('DemoCatalogService', () => {
  let service: DemoCatalogService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DemoCatalogService(prismaMock as any);
  });

  describe('isDemoEligible()', () => {
    it('accepts a question with options, an answer and explanations', () => {
      expect(isDemoEligible(makeQuestion(1) as any)).toBe(true);
    });

    it('rejects a question with fewer than the minimum options', () => {
      expect(isDemoEligible(makeQuestion(1, { options: makeOptions(2) }) as any)).toBe(false);
    });

    // CFA Level I legitimately uses three choices, so the floor must not assume four.
    it('accepts a three-option question', () => {
      const question = makeQuestion(1, {
        options: makeOptions(3),
        answer: { correctOptions: ['C'], explanations: [{ label: 'C', text: 'x' }] },
      });
      expect(isDemoEligible(question as any)).toBe(true);
    });

    it('rejects a question without an answer', () => {
      expect(isDemoEligible(makeQuestion(1, { answer: null }) as any)).toBe(false);
    });

    it('rejects a question whose answer has no explanations', () => {
      const question = makeQuestion(1, { answer: { correctOptions: ['A'], explanations: [] } });
      expect(isDemoEligible(question as any)).toBe(false);
    });

    it('rejects a question where a correct option has no matching explanation', () => {
      const question = makeQuestion(1, {
        answer: { correctOptions: ['A', 'B'], explanations: [{ label: 'A', text: 'Because A.' }] },
      });
      expect(isDemoEligible(question as any)).toBe(false);
    });

    it('rejects a question whose answer has no correct options', () => {
      const question = makeQuestion(1, {
        answer: { correctOptions: [], explanations: [{ label: 'A', text: 'x' }] },
      });
      expect(isDemoEligible(question as any)).toBe(false);
    });

    it('rejects a question whose correctOptions do not match any option label', () => {
      const question = makeQuestion(1, {
        answer: { correctOptions: ['Z'], explanations: [{ label: 'Z', text: 'x' }] },
      });
      expect(isDemoEligible(question as any)).toBe(false);
    });

    it('parses correctOptions stored as a JSON string', () => {
      const question = makeQuestion(1, {
        answer: { correctOptions: '["B"]', explanations: [{ label: 'B', text: 'x' }] },
      });
      expect(isDemoEligible(question as any)).toBe(true);
    });
  });

  describe('listDemoExams()', () => {
    it('returns an empty list when no templates exist', async () => {
      prismaMock.exam.findMany.mockResolvedValue([]);

      await expect(service.listDemoExams()).resolves.toEqual([]);
    });

    it('excludes an exam whose eligible questions are under the slice floor', async () => {
      prismaMock.exam.findMany.mockResolvedValue([makeTemplate()] as any);
      prismaMock.questionPool.findMany.mockResolvedValue([
        makePool(
          'Design Resilient Architectures',
          Array.from({ length: DEMO_SLICE_MIN - 1 }, (_, i) => makeQuestion(i + 1))
        ),
      ] as any);

      await expect(service.listDemoExams()).resolves.toEqual([]);
    });

    it('excludes questions that fail the eligibility predicate from the floor check', async () => {
      prismaMock.exam.findMany.mockResolvedValue([makeTemplate()] as any);
      prismaMock.questionPool.findMany.mockResolvedValue([
        makePool(
          'Design Resilient Architectures',
          Array.from({ length: DEMO_SLICE_MIN + 5 }, (_, i) => makeQuestion(i + 1, { answer: null }))
        ),
      ] as any);

      await expect(service.listDemoExams()).resolves.toEqual([]);
    });

    it('caps the advertised pool at the slice maximum', async () => {
      prismaMock.exam.findMany.mockResolvedValue([makeTemplate()] as any);
      prismaMock.questionPool.findMany.mockResolvedValue(fullyStockedPools(40) as any);

      const [exam] = await service.listDemoExams();

      expect(exam.poolSize).toBe(DEMO_SLICE_MAX);
    });

    it('reports per-domain availability that sums to the advertised pool', async () => {
      prismaMock.exam.findMany.mockResolvedValue([makeTemplate()] as any);
      prismaMock.questionPool.findMany.mockResolvedValue(fullyStockedPools(40) as any);

      const [exam] = await service.listDemoExams();
      const summed = exam.domains.reduce((sum, domain) => sum + domain.available, 0);

      expect(summed).toBe(exam.poolSize);
    });

    it('maps template metadata onto the catalog entry', async () => {
      prismaMock.exam.findMany.mockResolvedValue([makeTemplate()] as any);
      prismaMock.questionPool.findMany.mockResolvedValue(fullyStockedPools() as any);

      const [exam] = await service.listDemoExams();

      expect(exam).toMatchObject({
        id: 'tmpl-1',
        mark: 'AWS',
        vendor: 'Amazon Web Services',
        logoUrl: 'https://logo.svg',
        year: '2024',
        questions: 65,
        minutes: 130,
        passing: '72%',
      });
    });

    it('drops domains that have no eligible questions', async () => {
      prismaMock.exam.findMany.mockResolvedValue([makeTemplate()] as any);
      prismaMock.questionPool.findMany.mockResolvedValue([
        makePool(
          'Design Resilient Architectures',
          Array.from({ length: DEMO_SLICE_MIN + 2 }, (_, i) => makeQuestion(i + 1))
        ),
        makePool('Design Secure Applications', []),
      ] as any);

      const [exam] = await service.listDemoExams();

      expect(exam.domains.map((domain) => domain.name)).toEqual(['Design Resilient Architectures']);
    });
  });

  describe('buildQuiz()', () => {
    beforeEach(() => {
      prismaMock.exam.findMany.mockResolvedValue([makeTemplate()] as any);
      prismaMock.questionPool.findMany.mockResolvedValue(fullyStockedPools(40) as any);
    });

    it('returns exactly the requested number of questions', async () => {
      const questions = await service.buildQuiz('tmpl-1', {
        'Design Resilient Architectures': 6,
        'Design Secure Applications': 4,
      });

      expect(questions).toHaveLength(DEMO_QUIZ_SIZE);
    });

    it('honours the per-domain distribution', async () => {
      const questions = await service.buildQuiz('tmpl-1', {
        'Design Resilient Architectures': 7,
        'Design Secure Applications': 3,
      });

      const resilient = questions.filter((q) => q.topic === 'Design Resilient Architectures');
      expect(resilient).toHaveLength(7);
    });

    it('maps correct option labels to zero-based indexes', async () => {
      const questions = await service.buildQuiz('tmpl-1', {
        'Design Resilient Architectures': 10,
      });

      expect(questions[0].correctIndexes).toEqual([0]);
      expect(questions[0].options).toHaveLength(4);
    });

    it('maps multiple correct labels to multiple indexes', async () => {
      prismaMock.questionPool.findMany.mockResolvedValue([
        makePool(
          'Design Resilient Architectures',
          Array.from({ length: DEMO_SLICE_MIN + 5 }, (_, i) =>
            makeQuestion(i + 1, {
              answer: {
                correctOptions: ['B', 'D'],
                explanations: [
                  { label: 'B', text: 'x' },
                  { label: 'D', text: 'y' },
                ],
              },
            })
          )
        ),
      ] as any);

      const questions = await service.buildQuiz('tmpl-1', { 'Design Resilient Architectures': 10 });

      expect(questions[0].correctIndexes).toEqual([1, 3]);
    });

    it('excludes a pool question whose correct option has no explanation', async () => {
      const ineligible = makeQuestion(1, {
        answer: { correctOptions: ['A'], explanations: [{ label: 'B', text: 'only B' }] },
      });
      const eligible = Array.from({ length: DEMO_SLICE_MIN + 5 }, (_, i) => makeQuestion(i + 2));

      prismaMock.questionPool.findMany.mockResolvedValue([
        makePool('Design Resilient Architectures', [ineligible, ...eligible]),
      ] as any);

      const questions = await service.buildQuiz('tmpl-1', { 'Design Resilient Architectures': 10 });

      expect(questions.every((question) => question.explanation !== '')).toBe(true);
    });

    it('rejects a distribution that does not sum to the quiz size', async () => {
      await expect(
        service.buildQuiz('tmpl-1', { 'Design Resilient Architectures': 3 })
      ).rejects.toMatchObject({ status: 400 });
    });

    it('rejects an unknown domain', async () => {
      await expect(service.buildQuiz('tmpl-1', { Nonexistent: 10 })).rejects.toMatchObject({ status: 400 });
    });

    it('rejects an allocation larger than the domain slice', async () => {
      prismaMock.questionPool.findMany.mockResolvedValue([
        makePool(
          'Design Resilient Architectures',
          Array.from({ length: DEMO_SLICE_MIN + 2 }, (_, i) => makeQuestion(i + 1))
        ),
        makePool('Design Secure Applications', [makeQuestion(999)]),
      ] as any);

      await expect(
        service.buildQuiz('tmpl-1', { 'Design Resilient Architectures': 8, 'Design Secure Applications': 2 })
      ).rejects.toMatchObject({ status: 400 });
    });

    it('returns 404 when the exam is not demo-eligible', async () => {
      prismaMock.exam.findMany.mockResolvedValue([]);

      await expect(
        service.buildQuiz('missing', { 'Design Resilient Architectures': 10 })
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
