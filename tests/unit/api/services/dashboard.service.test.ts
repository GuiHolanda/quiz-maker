import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../__mocks__/prisma';
import { DashboardService } from '@/app/api/dashboard/stats/dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService();
  });

  function makeAnswer(sectionName: string, correctOptions: string[], selectedOptions: string[]) {
    return {
      selectedOptions: JSON.stringify(selectedOptions),
      mockExamQuestion: {
        examQuestion: {
          sectionName,
          answer: correctOptions.length > 0 ? { correctOptions } : null,
        },
      },
    };
  }

  function makeAttempt(overrides: {
    id?: string;
    score?: number | null;
    startedAt?: Date;
    finishedAt?: Date | null;
    mockExamName?: string | null;
    examName?: string;
    answers?: ReturnType<typeof makeAnswer>[];
  } = {}) {
    const {
      id = 'attempt-1',
      score = 80,
      startedAt = new Date('2024-01-01T10:00:00Z'),
      finishedAt = new Date('2024-01-01T11:00:00Z'),
      mockExamName = 'Test Simulado',
      examName = 'Test Exam',
      answers = [],
    } = overrides;

    return {
      id,
      userId: 'user-1',
      score,
      startedAt,
      finishedAt,
      mockExam: { name: mockExamName, exam: { name: examName } },
      answers,
    };
  }

  describe('getStats', () => {
    it('returns empty stats when user has no completed attempts', async () => {
      prismaMock.mockExamAttempt.findMany.mockResolvedValue([]);

      const result = await service.getStats('user-1');

      expect(result.totalSimuladosCompleted).toBe(0);
      expect(result.bestScore).toBeNull();
      expect(result.recentSessions).toEqual([]);
      expect(result.scoreTrend).toEqual([]);
      expect(result.domainBreakdown).toEqual([]);
    });

    it('returns bestScore as null when all attempt scores are null', async () => {
      prismaMock.mockExamAttempt.findMany.mockResolvedValue([
        makeAttempt({ id: 'a1', score: null }),
        makeAttempt({ id: 'a2', score: null }),
      ] as any);

      const result = await service.getStats('user-1');

      expect(result.bestScore).toBeNull();
    });

    it('returns the highest score as bestScore', async () => {
      prismaMock.mockExamAttempt.findMany.mockResolvedValue([
        makeAttempt({ id: 'a1', score: 70 }),
        makeAttempt({ id: 'a2', score: 90 }),
        makeAttempt({ id: 'a3', score: 55 }),
      ] as any);

      const result = await service.getStats('user-1');

      expect(result.bestScore).toBe(90);
    });

    it('limits recentSessions to 5 but counts all attempts in totalSimuladosCompleted', async () => {
      const attempts = Array.from({ length: 7 }, (_, i) =>
        makeAttempt({ id: `a${i}`, score: 70 + i })
      );
      prismaMock.mockExamAttempt.findMany.mockResolvedValue(attempts as any);

      const result = await service.getStats('user-1');

      expect(result.totalSimuladosCompleted).toBe(7);
      expect(result.recentSessions).toHaveLength(5);
    });

    it('maps recentSessions fields correctly', async () => {
      const startedAt = new Date('2024-03-01T09:00:00Z');
      const finishedAt = new Date('2024-03-01T09:45:00Z');
      prismaMock.mockExamAttempt.findMany.mockResolvedValue([
        makeAttempt({
          id: 'a1',
          score: 75,
          startedAt,
          finishedAt,
          mockExamName: 'Meu Simulado',
          examName: 'AWS SAA',
          answers: [
            makeAnswer('EC2', ['A'], ['A']),
            makeAnswer('S3', ['B'], ['C']),
          ],
        }),
      ] as any);

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
      prismaMock.mockExamAttempt.findMany.mockResolvedValue([
        makeAttempt({ mockExamName: null, examName: 'AWS SAA' }),
      ] as any);

      const result = await service.getStats('user-1');

      expect(result.recentSessions[0].simuladoName).toBe('AWS SAA');
    });

    it('returns scoreTrend in chronological order (oldest first)', async () => {
      // DB returns newest first (orderBy: finishedAt desc)
      prismaMock.mockExamAttempt.findMany.mockResolvedValue([
        makeAttempt({ id: 'a3', score: 90, finishedAt: new Date('2024-03-03T10:00:00Z') }),
        makeAttempt({ id: 'a2', score: 70, finishedAt: new Date('2024-03-02T10:00:00Z') }),
        makeAttempt({ id: 'a1', score: 60, finishedAt: new Date('2024-03-01T10:00:00Z') }),
      ] as any);

      const result = await service.getStats('user-1');

      expect(result.scoreTrend.map((p) => p.score)).toEqual([60, 70, 90]);
    });

    it('limits scoreTrend to 10 most recent attempts', async () => {
      // 12 attempts newest-first; service keeps first 10, then reverses to chronological
      const attempts = Array.from({ length: 12 }, (_, i) =>
        makeAttempt({
          id: `a${12 - i}`,
          score: 50 + i,
          finishedAt: new Date(`2024-01-${String(12 - i).padStart(2, '0')}T10:00:00Z`),
        })
      );
      prismaMock.mockExamAttempt.findMany.mockResolvedValue(attempts as any);

      const result = await service.getStats('user-1');

      expect(result.scoreTrend).toHaveLength(10);
    });

    it('excludes attempts with null score from scoreTrend', async () => {
      // DB newest first: a3 (90), a2 (null), a1 (80) → after filter & reverse: [80, 90]
      prismaMock.mockExamAttempt.findMany.mockResolvedValue([
        makeAttempt({ id: 'a3', score: 90, finishedAt: new Date('2024-03-03T10:00:00Z') }),
        makeAttempt({ id: 'a2', score: null, finishedAt: new Date('2024-03-02T10:00:00Z') }),
        makeAttempt({ id: 'a1', score: 80, finishedAt: new Date('2024-03-01T10:00:00Z') }),
      ] as any);

      const result = await service.getStats('user-1');

      expect(result.scoreTrend).toHaveLength(2);
      expect(result.scoreTrend.map((p) => p.score)).toEqual([80, 90]);
    });

    it('computes domainBreakdown average per section across attempts', async () => {
      // Attempt 1: Math 2/4 correct → sectionScore=50, Science 3/3 → sectionScore=100
      // Attempt 2: Math 4/4 → sectionScore=100, Science 1/2 → sectionScore=50
      // Expected: Math avgScore=round((50+100)/2)=75, Science avgScore=round((100+50)/2)=75
      prismaMock.mockExamAttempt.findMany.mockResolvedValue([
        makeAttempt({
          id: 'a1',
          answers: [
            makeAnswer('Math', ['A'], ['A']),
            makeAnswer('Math', ['B'], ['B']),
            makeAnswer('Math', ['C'], ['D']),
            makeAnswer('Math', ['D'], ['A']),
            makeAnswer('Science', ['A'], ['A']),
            makeAnswer('Science', ['B'], ['B']),
            makeAnswer('Science', ['C'], ['C']),
          ],
        }),
        makeAttempt({
          id: 'a2',
          answers: [
            makeAnswer('Math', ['A'], ['A']),
            makeAnswer('Math', ['B'], ['B']),
            makeAnswer('Math', ['C'], ['C']),
            makeAnswer('Math', ['D'], ['D']),
            makeAnswer('Science', ['A'], ['A']),
            makeAnswer('Science', ['B'], ['C']),
          ],
        }),
      ] as any);

      const result = await service.getStats('user-1');

      const math = result.domainBreakdown.find((d) => d.sectionName === 'Math');
      const science = result.domainBreakdown.find((d) => d.sectionName === 'Science');

      expect(math).toMatchObject({ sectionName: 'Math', avgScore: 75, totalAttempts: 2 });
      expect(science).toMatchObject({ sectionName: 'Science', avgScore: 75, totalAttempts: 2 });
    });

    it('treats questions without an answer record as incorrect in domainBreakdown', async () => {
      // 1 question has no answer → counted as wrong; 1 has answer → correct
      // sectionScore = round(1/2 * 100) = 50 for single attempt → avgScore = 50
      prismaMock.mockExamAttempt.findMany.mockResolvedValue([
        makeAttempt({
          id: 'a1',
          answers: [
            {
              selectedOptions: JSON.stringify(['A']),
              mockExamQuestion: { examQuestion: { sectionName: 'Math', answer: null } },
            },
            makeAnswer('Math', ['B'], ['B']),
          ],
        }),
      ] as any);

      const result = await service.getStats('user-1');

      const math = result.domainBreakdown.find((d) => d.sectionName === 'Math');
      expect(math?.avgScore).toBe(50);
    });
  });
});
