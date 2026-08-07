import { prisma } from '@/lib/prisma';
import type { DashboardStats, DashboardDomainStat, DashboardRecentSession, DashboardScoreTrendPoint } from '@/shared/types';

export class DashboardService {
  async getStats(userId: string): Promise<DashboardStats> {
    const attempts = await prisma.mockExamAttempt.findMany({
      where: { userId, finishedAt: { not: null } },
      orderBy: { finishedAt: 'desc' },
      include: {
        mockExam: { include: { exam: true } },
        answers: {
          include: {
            mockExamQuestion: {
              include: {
                examQuestion: { include: { answer: true } },
              },
            },
          },
        },
      },
    });

    const totalSimuladosCompleted = attempts.length;
    const bestScore = attempts.reduce<number | null>((best, a) => {
      if (a.score === null) return best;
      return best === null || a.score > best ? a.score : best;
    }, null);

    const recentSessions: DashboardRecentSession[] = attempts.slice(0, 5).map((attempt) => ({
      simuladoName: attempt.mockExam.name ?? attempt.mockExam.exam.name,
      examName: attempt.mockExam.exam.name,
      score: attempt.score ?? 0,
      totalQuestions: attempt.answers.length,
      durationMs: attempt.finishedAt
        ? new Date(attempt.finishedAt).getTime() - new Date(attempt.startedAt).getTime()
        : 0,
      finishedAt: attempt.finishedAt!.toISOString(),
    }));

    const scoreTrend: DashboardScoreTrendPoint[] = [...attempts]
      .filter((a) => a.score !== null && a.finishedAt !== null)
      .slice(0, 10)
      .reverse()
      .map((a) => ({
        score: a.score!,
        finishedAt: a.finishedAt!.toISOString(),
      }));

    const domainBreakdown = this.computeDomainBreakdown(attempts);

    return { totalSimuladosCompleted, bestScore, recentSessions, scoreTrend, domainBreakdown };
  }

  private computeDomainBreakdown(attempts: any[]): DashboardDomainStat[] {
    const sectionMap = new Map<string, { correctSum: number; totalSum: number; attemptCount: number }>();

    for (const attempt of attempts) {
      const sectionCorrect = new Map<string, { correct: number; total: number }>();

      for (const answer of attempt.answers) {
        const question = answer.mockExamQuestion.examQuestion;
        const section = question.sectionName;
        const correctOptions: string[] = question.answer
          ? (question.answer.correctOptions as string[])
          : [];
        const selectedOptions: string[] = JSON.parse(answer.selectedOptions);
        const isCorrect =
          correctOptions.length > 0 &&
          correctOptions.length === selectedOptions.length &&
          correctOptions.every((o: string) => selectedOptions.includes(o));

        const current = sectionCorrect.get(section) ?? { correct: 0, total: 0 };
        sectionCorrect.set(section, {
          correct: current.correct + (isCorrect ? 1 : 0),
          total: current.total + 1,
        });
      }

      for (const [section, { correct, total }] of Array.from(sectionCorrect.entries())) {
        const existing = sectionMap.get(section) ?? { correctSum: 0, totalSum: 0, attemptCount: 0 };
        const sectionScore = total > 0 ? Math.round((correct / total) * 100) : 0;
        sectionMap.set(section, {
          correctSum: existing.correctSum + sectionScore,
          totalSum: existing.totalSum + total,
          attemptCount: existing.attemptCount + 1,
        });
      }
    }

    return Array.from(sectionMap.entries()).map(([sectionName, { correctSum, attemptCount }]) => ({
      sectionName,
      avgScore: attemptCount > 0 ? Math.round(correctSum / attemptCount) : 0,
      totalAttempts: attemptCount,
    }));
  }
}
