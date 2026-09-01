import { beforeEach } from 'vitest';

import { prismaMock } from '../__mocks__/prisma';
import { QuestionBankService } from '@/features/services/question-bank.service';

const service = new QuestionBankService();

beforeEach(() => {
  prismaMock.mockExamAttemptAnswer.findMany.mockResolvedValue([] as never);
});

function makeQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    text: 'What is S3?',
    difficulty: 'easy',
    examName: 'AWS SAA',
    sectionName: 'Storage',
    topicName: null,
    examId: null,
    correctCount: 1,
    createdAt: new Date('2024-01-01'),
    options: [{ label: 'A', text: 'Object storage' }],
    answer: null,
    exam: { type: 'certification' },
    ...overrides,
  };
}

function makeAttemptAnswer(overrides: Record<string, unknown> = {}) {
  return {
    isCorrect: true,
    selectedOptions: '["A"]',
    attempt: { finishedAt: new Date('2024-02-01') },
    mockExamQuestion: { examQuestionId: 1 },
    ...overrides,
  };
}

describe('QuestionBankService.getQuestions', () => {
  describe('search filter', () => {
    it('omits OR clause when search is not provided', async () => {
      prismaMock.examQuestion.findMany.mockResolvedValue([]);
      await service.getQuestions({ userId: 'u1', page: 1, pageSize: 10 });
      const where = prismaMock.examQuestion.findMany.mock.calls[0][0]?.where as Record<string, unknown>;
      expect(where['OR']).toBeUndefined();
    });

    it('builds OR across text, examName, sectionName and options when search is provided', async () => {
      prismaMock.examQuestion.findMany.mockResolvedValue([]);
      await service.getQuestions({ userId: 'u1', search: 'S3', page: 1, pageSize: 10 });
      const where = prismaMock.examQuestion.findMany.mock.calls[0][0]?.where as Record<string, unknown>;
      const orClauses = where['OR'] as Array<Record<string, unknown>>;
      expect(orClauses).toBeDefined();
      const fields = orClauses.map((c) => Object.keys(c)[0]);
      expect(fields).toContain('text');
      expect(fields).toContain('examName');
      expect(fields).toContain('sectionName');
      expect(fields).toContain('options');
    });

    it('options clause uses some: { text: ... }', async () => {
      prismaMock.examQuestion.findMany.mockResolvedValue([]);
      await service.getQuestions({ userId: 'u1', search: 'S3', page: 1, pageSize: 10 });
      const where = prismaMock.examQuestion.findMany.mock.calls[0][0]?.where as Record<string, unknown>;
      const orClauses = where['OR'] as Array<Record<string, unknown>>;
      const optionsClause = orClauses.find((c) => c['options']) as Record<string, unknown>;
      expect(optionsClause['options']).toMatchObject({ some: { text: expect.objectContaining({ contains: 'S3' }) } });
    });
  });

  describe('other filters', () => {
    it('adds type filter when type is not all', async () => {
      prismaMock.examQuestion.findMany.mockResolvedValue([]);
      await service.getQuestions({ userId: 'u1', type: 'certification', page: 1, pageSize: 10 });
      const where = prismaMock.examQuestion.findMany.mock.calls[0][0]?.where as Record<string, unknown>;
      expect(where['exam']).toEqual({ type: 'certification' });
    });

    it('omits type filter when type is all', async () => {
      prismaMock.examQuestion.findMany.mockResolvedValue([]);
      await service.getQuestions({ userId: 'u1', type: 'all', page: 1, pageSize: 10 });
      const where = prismaMock.examQuestion.findMany.mock.calls[0][0]?.where as Record<string, unknown>;
      expect(where['exam']).toBeUndefined();
    });

    it('sets answer: { isNot: null } when hasAnswer is true', async () => {
      prismaMock.examQuestion.findMany.mockResolvedValue([]);
      await service.getQuestions({ userId: 'u1', hasAnswer: true, page: 1, pageSize: 10 });
      const where = prismaMock.examQuestion.findMany.mock.calls[0][0]?.where as Record<string, unknown>;
      expect(where['answer']).toEqual({ isNot: null });
    });

    it('sets answer: { is: null } when hasAnswer is false', async () => {
      prismaMock.examQuestion.findMany.mockResolvedValue([]);
      await service.getQuestions({ userId: 'u1', hasAnswer: false, page: 1, pageSize: 10 });
      const where = prismaMock.examQuestion.findMany.mock.calls[0][0]?.where as Record<string, unknown>;
      expect(where['answer']).toEqual({ is: null });
    });
  });

  describe('hasExplanation post-filter', () => {
    it('keeps questions that have explanations when hasExplanation is true', async () => {
      const withExplanation = makeQuestion({
        answer: { explanations: [{ label: 'A', text: 'Because...' }] },
      });
      const withoutExplanation = makeQuestion({ id: 2, answer: { explanations: [] } });
      prismaMock.examQuestion.findMany.mockResolvedValue([withExplanation, withoutExplanation] as any);
      const result = await service.getQuestions({ userId: 'u1', hasExplanation: true, page: 1, pageSize: 10 });
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].id).toBe(1);
    });

    it('keeps questions without explanations when hasExplanation is false', async () => {
      const withExplanation = makeQuestion({
        answer: { explanations: [{ label: 'A', text: 'Because...' }] },
      });
      const withoutExplanation = makeQuestion({ id: 2, answer: { explanations: [] } });
      prismaMock.examQuestion.findMany.mockResolvedValue([withExplanation, withoutExplanation] as any);
      const result = await service.getQuestions({ userId: 'u1', hasExplanation: false, page: 1, pageSize: 10 });
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].id).toBe(2);
    });

    it('does not filter by explanation when hasExplanation is undefined', async () => {
      const q1 = makeQuestion({ answer: { explanations: [{ label: 'A', text: 'ok' }] } });
      const q2 = makeQuestion({ id: 2, answer: { explanations: [] } });
      prismaMock.examQuestion.findMany.mockResolvedValue([q1, q2] as any);
      const result = await service.getQuestions({ userId: 'u1', page: 1, pageSize: 10 });
      expect(result.questions).toHaveLength(2);
    });
  });

  describe('pagination', () => {
    it('total reflects the filtered count, not the full DB count', async () => {
      const rows = Array.from({ length: 3 }, (_, i) => makeQuestion({ id: i + 1 }));
      prismaMock.examQuestion.findMany.mockResolvedValue(rows as any);
      const result = await service.getQuestions({ userId: 'u1', page: 1, pageSize: 10 });
      expect(result.total).toBe(3);
    });

    it('slices correctly for page 2', async () => {
      const rows = Array.from({ length: 5 }, (_, i) => makeQuestion({ id: i + 1 }));
      prismaMock.examQuestion.findMany.mockResolvedValue(rows as any);
      const result = await service.getQuestions({ userId: 'u1', page: 2, pageSize: 2 });
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].id).toBe(3);
    });
  });

  describe('response shape', () => {
    it('maps public_exam type with subject · topic label', async () => {
      const row = makeQuestion({
        sectionName: 'Direito Constitucional',
        topicName: 'Princípios',
        exam: { type: 'public_exam' },
      });
      prismaMock.examQuestion.findMany.mockResolvedValue([row] as any);
      const result = await service.getQuestions({ userId: 'u1', page: 1, pageSize: 10 });
      expect(result.questions[0].topic).toBe('Direito Constitucional · Princípios');
    });

    it('maps certification type with sectionName only as topic', async () => {
      const row = makeQuestion({ sectionName: 'Storage', topicName: null, exam: { type: 'certification' } });
      prismaMock.examQuestion.findMany.mockResolvedValue([row] as any);
      const result = await service.getQuestions({ userId: 'u1', page: 1, pageSize: 10 });
      expect(result.questions[0].topic).toBe('Storage');
    });
  });

  describe('history aggregation', () => {
    it('derives attempts, accuracy, situation and marked options from the latest finished attempt', async () => {
      prismaMock.examQuestion.findMany.mockResolvedValue([makeQuestion({ id: 1 })] as any);
      prismaMock.mockExamAttemptAnswer.findMany.mockResolvedValue([
        makeAttemptAnswer({ isCorrect: true, selectedOptions: '["B"]', attempt: { finishedAt: new Date('2024-02-10') } }),
        makeAttemptAnswer({ isCorrect: false, selectedOptions: '["A"]', attempt: { finishedAt: new Date('2024-01-15') } }),
      ] as any);

      const result = await service.getQuestions({ userId: 'u1', page: 1, pageSize: 10 });

      expect(result.questions[0].history).toEqual({
        attempts: 2,
        correct: 1,
        accuracy: 50,
        situation: 'correct',
        markedOptions: ['B'],
      });
    });

    it('marks a question with no attempts as unanswered', async () => {
      prismaMock.examQuestion.findMany.mockResolvedValue([makeQuestion({ id: 9 })] as any);

      const result = await service.getQuestions({ userId: 'u1', page: 1, pageSize: 10 });

      expect(result.questions[0].history.situation).toBe('unanswered');
      expect(result.questions[0].history.attempts).toBe(0);
    });
  });

  describe('situation filter', () => {
    it('keeps only questions matching the requested situation', async () => {
      prismaMock.examQuestion.findMany.mockResolvedValue([
        makeQuestion({ id: 1 }),
        makeQuestion({ id: 2 }),
      ] as any);
      prismaMock.mockExamAttemptAnswer.findMany.mockResolvedValue([
        makeAttemptAnswer({ isCorrect: true, mockExamQuestion: { examQuestionId: 1 } }),
      ] as any);

      const result = await service.getQuestions({ userId: 'u1', situation: 'unanswered', page: 1, pageSize: 10 });

      expect(result.questions.map((q) => q.id)).toEqual([2]);
    });
  });

  describe('history-aware sorts', () => {
    it('mostUsed ranks answered questions by attempt count desc, unanswered last', async () => {
      prismaMock.examQuestion.findMany.mockResolvedValue([
        makeQuestion({ id: 1 }),
        makeQuestion({ id: 2 }),
        makeQuestion({ id: 3 }),
      ] as any);
      prismaMock.mockExamAttemptAnswer.findMany.mockResolvedValue([
        makeAttemptAnswer({ mockExamQuestion: { examQuestionId: 2 } }),
        makeAttemptAnswer({ mockExamQuestion: { examQuestionId: 1 } }),
        makeAttemptAnswer({ mockExamQuestion: { examQuestionId: 1 } }),
      ] as any);

      const result = await service.getQuestions({ userId: 'u1', sort: 'mostUsed', page: 1, pageSize: 10 });

      expect(result.questions.map((q) => q.id)).toEqual([1, 2, 3]);
    });

    it('errorRate ranks answered questions by accuracy asc, unanswered last', async () => {
      prismaMock.examQuestion.findMany.mockResolvedValue([
        makeQuestion({ id: 1 }),
        makeQuestion({ id: 2 }),
        makeQuestion({ id: 3 }),
      ] as any);
      prismaMock.mockExamAttemptAnswer.findMany.mockResolvedValue([
        makeAttemptAnswer({ isCorrect: false, mockExamQuestion: { examQuestionId: 1 } }),
        makeAttemptAnswer({ isCorrect: true, mockExamQuestion: { examQuestionId: 2 } }),
      ] as any);

      const result = await service.getQuestions({ userId: 'u1', sort: 'errorRate', page: 1, pageSize: 10 });

      expect(result.questions.map((q) => q.id)).toEqual([1, 2, 3]);
    });
  });

  describe('summary', () => {
    it('aggregates counts across the whole bank regardless of the page filters', async () => {
      const answered = makeQuestion({ id: 1, answer: { explanations: [] } });
      const unanswered = makeQuestion({ id: 2, answer: null });
      prismaMock.examQuestion.findMany.mockResolvedValue([answered, unanswered] as any);
      prismaMock.mockExamAttemptAnswer.findMany.mockResolvedValue([
        makeAttemptAnswer({ isCorrect: true, mockExamQuestion: { examQuestionId: 1 } }),
        makeAttemptAnswer({ isCorrect: false, mockExamQuestion: { examQuestionId: 1 } }),
      ] as any);

      const result = await service.getQuestions({ userId: 'u1', situation: 'unanswered', page: 1, pageSize: 10 });

      expect(result.summary).toEqual({
        saved: 2,
        answered: 1,
        accuracy: 50,
        attempts: 2,
        correct: 1,
        withoutExplanation: 1,
        bySituation: { correct: 1, wrong: 0, unanswered: 1 },
      });
    });
  });
});
