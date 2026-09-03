import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../__mocks__/prisma';
import { DashboardService } from '@/app/api/dashboard/stats/dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService();
  });

  function makeRecentAttempt(overrides: {
    score?: number | null;
    startedAt?: Date;
    finishedAt?: Date | null;
    mockExamName?: string | null;
    examName?: string;
    answerCount?: number;
  } = {}) {
    const {
      score = 80,
      startedAt = new Date('2024-01-01T10:00:00Z'),
      finishedAt = new Date('2024-01-01T11:00:00Z'),
      mockExamName = 'Test Simulado',
      examName = 'Test Exam',
      answerCount = 0,
    } = overrides;

    return {
      score,
      startedAt,
      finishedAt,
      mockExam: { name: mockExamName, exam: { name: examName } },
      _count: { answers: answerCount },
    };
  }

  function makeSectionAnswer(attemptId: number, sectionName: string, isCorrect: boolean) {
    return { attemptId, isCorrect, mockExamQuestion: { examQuestion: { sectionName } } };
  }

  // As duas leituras de mockExamAttempt.findMany se distinguem pelo `take`: a de sessões
  // recentes pede 5, a de tendência pede 10.
  function setup(options: {
    total?: number;
    bestScore?: number | null;
    recent?: ReturnType<typeof makeRecentAttempt>[];
    trend?: { score: number | null; finishedAt: Date | null }[];
    sectionAnswers?: ReturnType<typeof makeSectionAnswer>[];
  } = {}) {
    const { total = 0, bestScore = null, recent = [], trend = [], sectionAnswers = [] } = options;

    prismaMock.mockExamAttempt.count.mockResolvedValue(total);
    prismaMock.mockExamAttempt.aggregate.mockResolvedValue({ _max: { score: bestScore } } as any);
    prismaMock.mockExamAttempt.findMany.mockImplementation((args: any) =>
      Promise.resolve(args?.take === 5 ? recent : trend) as any
    );
    prismaMock.mockExamAttemptAnswer.findMany.mockResolvedValue(sectionAnswers as any);
  }

  describe('getStats', () => {
    it('returns empty stats when user has no completed attempts', async () => {
      setup();

      const result = await service.getStats('user-1');

      expect(result.totalSimuladosCompleted).toBe(0);
      expect(result.bestScore).toBeNull();
      expect(result.recentSessions).toEqual([]);
      expect(result.scoreTrend).toEqual([]);
      expect(result.domainBreakdown).toEqual([]);
    });

    it('returns bestScore as null when all attempt scores are null', async () => {
      setup({ total: 2, bestScore: null, recent: [makeRecentAttempt({ score: null })] });

      const result = await service.getStats('user-1');

      expect(result.bestScore).toBeNull();
    });

    it('returns the highest score as bestScore', async () => {
      setup({ total: 3, bestScore: 90 });

      const result = await service.getStats('user-1');

      expect(result.bestScore).toBe(90);
    });

    it('counts every finished attempt but only reads the 5 most recent sessions', async () => {
      setup({ total: 7, recent: Array.from({ length: 5 }, () => makeRecentAttempt()) });

      const result = await service.getStats('user-1');

      expect(result.totalSimuladosCompleted).toBe(7);
      expect(result.recentSessions).toHaveLength(5);
    });

    it('pushes the session and trend limits down to the database', async () => {
      setup({ total: 40 });

      await service.getStats('user-1');

      const takes = prismaMock.mockExamAttempt.findMany.mock.calls.map(([args]: any) => args.take);
      expect(takes).toEqual([5, 10]);
    });

    it('excludes null scores from the trend query instead of filtering in memory', async () => {
      setup({ total: 3 });

      await service.getStats('user-1');

      const trendCall = prismaMock.mockExamAttempt.findMany.mock.calls.find(
        ([args]: any) => args.take === 10
      )?.[0] as any;
      expect(trendCall.where.score).toEqual({ not: null });
    });

    it('maps recentSessions fields correctly', async () => {
      const startedAt = new Date('2024-03-01T09:00:00Z');
      const finishedAt = new Date('2024-03-01T09:45:00Z');
      setup({
        total: 1,
        recent: [
          makeRecentAttempt({
            score: 75,
            startedAt,
            finishedAt,
            mockExamName: 'Meu Simulado',
            examName: 'AWS SAA',
            answerCount: 2,
          }),
        ],
      });

      const result = await service.getStats('user-1');

      expect(result.recentSessions[0]).toMatchObject({
        simuladoName: 'Meu Simulado',
        examName: 'AWS SAA',
        score: 75,
        totalQuestions: 2,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        finishedAt: finishedAt.toISOString(),
      });
    });

    it('falls back to examName as simuladoName when mockExam.name is null', async () => {
      setup({ total: 1, recent: [makeRecentAttempt({ mockExamName: null, examName: 'AWS SAA' })] });

      const result = await service.getStats('user-1');

      expect(result.recentSessions[0].simuladoName).toBe('AWS SAA');
    });

    it('returns scoreTrend in chronological order (oldest first)', async () => {
      // O banco devolve do mais novo para o mais antigo (orderBy: finishedAt desc)
      setup({
        total: 3,
        trend: [
          { score: 90, finishedAt: new Date('2024-03-03T10:00:00Z') },
          { score: 70, finishedAt: new Date('2024-03-02T10:00:00Z') },
          { score: 60, finishedAt: new Date('2024-03-01T10:00:00Z') },
        ],
      });

      const result = await service.getStats('user-1');

      expect(result.scoreTrend.map((p) => p.score)).toEqual([60, 70, 90]);
    });

    it('computes domainBreakdown average per section across attempts', async () => {
      // Tentativa 1: Math 2/4 → 50, Science 3/3 → 100
      // Tentativa 2: Math 4/4 → 100, Science 1/2 → 50
      // Esperado: Math (50+100)/2 = 75, Science (100+50)/2 = 75
      setup({
        total: 2,
        sectionAnswers: [
          makeSectionAnswer(1, 'Math', true),
          makeSectionAnswer(1, 'Math', true),
          makeSectionAnswer(1, 'Math', false),
          makeSectionAnswer(1, 'Math', false),
          makeSectionAnswer(1, 'Science', true),
          makeSectionAnswer(1, 'Science', true),
          makeSectionAnswer(1, 'Science', true),
          makeSectionAnswer(2, 'Math', true),
          makeSectionAnswer(2, 'Math', true),
          makeSectionAnswer(2, 'Math', true),
          makeSectionAnswer(2, 'Math', true),
          makeSectionAnswer(2, 'Science', true),
          makeSectionAnswer(2, 'Science', false),
        ],
      });

      const result = await service.getStats('user-1');

      const math = result.domainBreakdown.find((d) => d.sectionName === 'Math');
      const science = result.domainBreakdown.find((d) => d.sectionName === 'Science');

      expect(math).toMatchObject({ sectionName: 'Math', avgScore: 75, totalAttempts: 2 });
      expect(science).toMatchObject({ sectionName: 'Science', avgScore: 75, totalAttempts: 2 });
    });

    it('keeps a section separate per attempt when scoring the breakdown', async () => {
      // A mesma seção em duas tentativas conta como duas amostras, não como um pote só:
      // 1/1 e 0/1 → (100 + 0) / 2 = 50, e não 1/2 = 50 por acaso — totalAttempts prova a diferença.
      setup({
        total: 2,
        sectionAnswers: [makeSectionAnswer(1, 'Math', true), makeSectionAnswer(2, 'Math', false)],
      });

      const result = await service.getStats('user-1');

      expect(result.domainBreakdown).toEqual([{ sectionName: 'Math', avgScore: 50, totalAttempts: 2 }]);
    });

    it('treats an answer stored as incorrect (no gabarito at finish time) as wrong', async () => {
      setup({
        total: 1,
        sectionAnswers: [makeSectionAnswer(1, 'Math', false), makeSectionAnswer(1, 'Math', true)],
      });

      const result = await service.getStats('user-1');

      expect(result.domainBreakdown.find((d) => d.sectionName === 'Math')?.avgScore).toBe(50);
    });
  });
});
