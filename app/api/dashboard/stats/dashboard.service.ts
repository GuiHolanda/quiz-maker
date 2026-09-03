import { prisma } from '@/lib/prisma';
import type {
  DashboardStats,
  DashboardDomainStat,
  DashboardRecentSession,
  DashboardScoreTrendPoint,
} from '@/shared/types';

const RECENT_SESSIONS_LIMIT = 5;
const SCORE_TREND_LIMIT = 10;

type SectionAnswer = {
  attemptId: number;
  isCorrect: boolean;
  mockExamQuestion: { examQuestion: { sectionName: string } };
};

export class DashboardService {
  async getStats(userId: string): Promise<DashboardStats> {
    const finishedAttempts = { userId, finishedAt: { not: null } };

    const [totalSimuladosCompleted, scoreAggregate, recentAttempts, trendAttempts, sectionAnswers] = await Promise.all([
      prisma.mockExamAttempt.count({ where: finishedAttempts }),
      prisma.mockExamAttempt.aggregate({ where: finishedAttempts, _max: { score: true } }),
      prisma.mockExamAttempt.findMany({
        where: finishedAttempts,
        orderBy: { finishedAt: 'desc' },
        take: RECENT_SESSIONS_LIMIT,
        select: {
          score: true,
          startedAt: true,
          finishedAt: true,
          mockExam: { select: { name: true, exam: { select: { name: true } } } },
          _count: { select: { answers: true } },
        },
      }),
      prisma.mockExamAttempt.findMany({
        where: { ...finishedAttempts, score: { not: null } },
        orderBy: { finishedAt: 'desc' },
        take: SCORE_TREND_LIMIT,
        select: { score: true, finishedAt: true },
      }),
      // isCorrect é a mesma comparação de conjuntos que finishAttempt grava, e o script
      // db:backfill-answer-correctness cobriu as linhas antigas — ler o campo evita
      // carregar examQuestion.text e answer.correctOptions só para recomputá-lo aqui.
      prisma.mockExamAttemptAnswer.findMany({
        where: { attempt: finishedAttempts },
        select: {
          attemptId: true,
          isCorrect: true,
          mockExamQuestion: { select: { examQuestion: { select: { sectionName: true } } } },
        },
      }),
    ]);

    const recentSessions: DashboardRecentSession[] = recentAttempts.map((attempt) => ({
      simuladoName: attempt.mockExam.name ?? attempt.mockExam.exam.name,
      examName: attempt.mockExam.exam.name,
      score: attempt.score ?? 0,
      totalQuestions: attempt._count.answers,
      durationMs: attempt.finishedAt
        ? new Date(attempt.finishedAt).getTime() - new Date(attempt.startedAt).getTime()
        : 0,
      finishedAt: attempt.finishedAt!.toISOString(),
    }));

    const scoreTrend: DashboardScoreTrendPoint[] = [...trendAttempts].reverse().map((attempt) => ({
      score: attempt.score!,
      finishedAt: attempt.finishedAt!.toISOString(),
    }));

    return {
      totalSimuladosCompleted,
      bestScore: scoreAggregate._max.score ?? null,
      recentSessions,
      scoreTrend,
      domainBreakdown: this.computeDomainBreakdown(sectionAnswers),
    };
  }

  private computeDomainBreakdown(answers: SectionAnswer[]): DashboardDomainStat[] {
    const perAttemptSection = new Map<string, { section: string; correct: number; total: number }>();

    for (const answer of answers) {
      const section = answer.mockExamQuestion.examQuestion.sectionName;
      const key = `${answer.attemptId}::${section}`;
      const current = perAttemptSection.get(key) ?? { section, correct: 0, total: 0 };

      perAttemptSection.set(key, {
        section,
        correct: current.correct + (answer.isCorrect ? 1 : 0),
        total: current.total + 1,
      });
    }

    const sectionMap = new Map<string, { correctSum: number; attemptCount: number }>();

    for (const { section, correct, total } of Array.from(perAttemptSection.values())) {
      const existing = sectionMap.get(section) ?? { correctSum: 0, attemptCount: 0 };
      const sectionScore = total > 0 ? Math.round((correct / total) * 100) : 0;

      sectionMap.set(section, {
        correctSum: existing.correctSum + sectionScore,
        attemptCount: existing.attemptCount + 1,
      });
    }

    return Array.from(sectionMap.entries()).map(([sectionName, { correctSum, attemptCount }]) => ({
      sectionName,
      avgScore: attemptCount > 0 ? Math.round(correctSum / attemptCount) : 0,
      totalAttempts: attemptCount,
    }));
  }
}
