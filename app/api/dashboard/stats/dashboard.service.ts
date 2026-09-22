import { prisma } from '@/lib/prisma';
import { computeExamReadiness } from '@/lib/exam/readiness';
import type {
  DashboardActivityItem,
  DashboardExamProgress,
  DashboardHome,
  DashboardKpis,
  DashboardResume,
  DashboardWeakDomain,
} from '@/shared/types';

const DASHBOARD_TZ = 'America/Sao_Paulo';
const DAY = 24 * 60 * 60 * 1000;
const ACTIVITY_LIMIT = 6;
const EXAMS_LIMIT = 5;
const WEAK_DOMAIN_LIMIT = 4;
const WEAK_DOMAIN_MIN_VOLUME = 5;

const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: DASHBOARD_TZ });
const localDay = (date: Date): string => dayFormatter.format(date);

function accuracyPct(score: number | null, totalQuestions: number): number | null {
  if (score === null || totalQuestions <= 0) return null;
  return Math.round((score / totalQuestions) * 100);
}

type AttemptRow = {
  id: number;
  startedAt: Date;
  finishedAt: Date | null;
  score: number | null;
  timedOut: boolean;
  mockExamId: number;
  mockExam: {
    name: string | null;
    examId: string;
    durationMinutes: number | null;
    _count: { questions: number };
    exam: { name: string; examBoard: { name: string } | null };
  };
  _count: { answers: number };
};

type UsageLogRow = { action: string; count: number; refName: string | null; createdAt: Date };

type ExamRow = {
  id: string;
  name: string;
  type: string;
  key: string | null;
  role: string | null;
  year: number | null;
  createdAt: Date;
  examBoard: { name: string } | null;
  sections: { id: string; topics: { id: string }[] }[];
};

type QuestionRow = { examId: string | null; sectionId: string | null; topicId: string | null };

type SectionAnswerRow = {
  isCorrect: boolean;
  attempt: { finishedAt: Date | null; timedOut: boolean };
  mockExamQuestion: { examQuestionId: number; examQuestion: { sectionName: string } };
};

type AutoConfigRow = { seedName: string; updatedAt: Date };

export class DashboardService {
  async getStats(userId: string): Promise<DashboardHome> {
    const now = Date.now();

    const [attempts, usageLogs, exams, questions, sectionAnswers, autoConfigJobs, simuladosTotal] = await Promise.all([
      prisma.mockExamAttempt.findMany({
        where: { userId },
        select: {
          id: true,
          startedAt: true,
          finishedAt: true,
          score: true,
          timedOut: true,
          mockExamId: true,
          mockExam: {
            select: {
              name: true,
              examId: true,
              durationMinutes: true,
              _count: { select: { questions: true } },
              exam: { select: { name: true, examBoard: { select: { name: true } } } },
            },
          },
          _count: { select: { answers: true } },
        },
      }) as Promise<AttemptRow[]>,
      prisma.usageLog.findMany({
        where: { userId, createdAt: { gte: new Date(now - 60 * DAY) } },
        select: { action: true, count: true, refName: true, createdAt: true },
      }) as Promise<UsageLogRow[]>,
      prisma.exam.findMany({
        where: { userId, isTemplate: false },
        select: {
          id: true,
          name: true,
          type: true,
          key: true,
          role: true,
          year: true,
          createdAt: true,
          examBoard: { select: { name: true } },
          sections: { select: { id: true, topics: { select: { id: true } } } },
        },
      }) as Promise<ExamRow[]>,
      prisma.examQuestion.findMany({
        where: { userId },
        select: { examId: true, sectionId: true, topicId: true },
      }) as Promise<QuestionRow[]>,
      prisma.mockExamAttemptAnswer.findMany({
        where: {
          attempt: { userId, finishedAt: { not: null } },
          mockExamQuestion: { examQuestion: { userId } },
        },
        select: {
          isCorrect: true,
          attempt: { select: { finishedAt: true, timedOut: true } },
          mockExamQuestion: {
            select: { examQuestionId: true, examQuestion: { select: { sectionName: true } } },
          },
        },
      }) as Promise<SectionAnswerRow[]>,
      prisma.autoConfigJob.findMany({
        where: { userId, status: 'done', updatedAt: { gte: new Date(now - 7 * DAY) } },
        select: { seedName: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }) as Promise<AutoConfigRow[]>,
      prisma.mockExam.count({ where: { userId } }),
    ]);

    return {
      kpis: this.computeKpis(attempts, usageLogs, simuladosTotal, now),
      resume: this.computeResume(attempts),
      examsInProgress: this.computeExamsInProgress(exams, questions, attempts),
      weakDomains: this.computeWeakDomains(sectionAnswers, now),
      quickActions: {
        bankCount: questions.length,
        wrongOpenCount: this.computeWrongOpenCount(sectionAnswers),
      },
      activity: this.computeActivity(attempts, usageLogs, autoConfigJobs, exams, now),
    };
  }

  private computeKpis(
    attempts: AttemptRow[],
    usageLogs: UsageLogRow[],
    simuladosTotal: number,
    now: number
  ): DashboardKpis {
    const activeDays = new Set<string>();
    for (const attempt of attempts) {
      if (attempt.finishedAt) activeDays.add(localDay(attempt.finishedAt));
    }
    for (const log of usageLogs) activeDays.add(localDay(log.createdAt));

    // Step by exact epoch millis, not setDate/getDate — those read the runtime's local
    // calendar, which can disagree with localDay's fixed DASHBOARD_TZ across a DST boundary.
    let cursor = new Date(now);
    if (!activeDays.has(localDay(cursor))) cursor = new Date(cursor.getTime() - DAY);
    let streakDays = 0;
    while (activeDays.has(localDay(cursor))) {
      streakDays += 1;
      cursor = new Date(cursor.getTime() - DAY);
    }

    const finishedIn = (from: number, to: number) =>
      attempts.filter((a) => a.finishedAt !== null && a.finishedAt.getTime() >= from && a.finishedAt.getTime() < to);

    const answersIn = (from: number, to: number) => finishedIn(from, to).reduce((sum, a) => sum + a._count.answers, 0);

    const questionsThisWeek = answersIn(now - 7 * DAY, now + 1);
    const questionsWeekDelta = questionsThisWeek - answersIn(now - 14 * DAY, now - 7 * DAY);

    const avgIn = (from: number, to: number): number | null => {
      const pcts = finishedIn(from, to)
        .filter((a) => !a.timedOut)
        .map((a) => accuracyPct(a.score, a.mockExam._count.questions))
        .filter((p): p is number => p !== null);
      if (pcts.length === 0) return null;
      return Math.round(pcts.reduce((sum, p) => sum + p, 0) / pcts.length);
    };

    const avgAccuracy = avgIn(now - 30 * DAY, now + 1);
    const avgAccuracyPrev = avgIn(now - 60 * DAY, now - 30 * DAY);
    const avgAccuracyDelta = avgAccuracy !== null && avgAccuracyPrev !== null ? avgAccuracy - avgAccuracyPrev : null;

    return {
      streakDays,
      questionsThisWeek,
      questionsWeekDelta,
      avgAccuracy,
      avgAccuracyDelta,
      simuladosTotal,
      simuladosOpen: attempts.filter((a) => a.finishedAt === null).length,
    };
  }

  private computeResume(attempts: AttemptRow[]): DashboardResume | null {
    const open = attempts
      .filter((a) => a.finishedAt === null)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];

    if (!open) return null;

    return {
      mockExamId: open.mockExamId,
      attemptId: open.id,
      simuladoName: open.mockExam.name ?? open.mockExam.exam.name,
      examName: open.mockExam.exam.name,
      examBoardName: open.mockExam.exam.examBoard?.name ?? null,
      totalQuestions: open.mockExam._count.questions,
      durationMinutes: open.mockExam.durationMinutes,
      startedAt: open.startedAt.toISOString(),
    };
  }

  private computeExamsInProgress(
    exams: ExamRow[],
    questions: QuestionRow[],
    attempts: AttemptRow[]
  ): DashboardExamProgress[] {
    const finishedByExam = new Map<string, number[]>();
    const attemptExamIds = new Set<string>();
    for (const attempt of attempts) {
      attemptExamIds.add(attempt.mockExam.examId);
      const pct = accuracyPct(attempt.score, attempt.mockExam._count.questions);
      if (attempt.finishedAt !== null && !attempt.timedOut && pct !== null) {
        const list = finishedByExam.get(attempt.mockExam.examId) ?? [];
        list.push(pct);
        finishedByExam.set(attempt.mockExam.examId, list);
      }
    }

    return exams
      .filter((exam) => questions.some((q) => q.examId === exam.id) || attemptExamIds.has(exam.id))
      .map((exam) => {
        const examQuestions = questions.filter((q) => q.examId === exam.id);
        const finishedPcts = finishedByExam.get(exam.id) ?? [];
        return {
          examId: exam.id,
          name: exam.name,
          type: exam.type as DashboardExamProgress['type'],
          boardName: exam.examBoard?.name ?? null,
          keyLabel: exam.key ?? exam.role ?? (exam.year !== null ? String(exam.year) : null),
          readiness: computeExamReadiness(exam.sections, examQuestions),
          accuracy: finishedPcts.length
            ? Math.round(finishedPcts.reduce((sum, p) => sum + p, 0) / finishedPcts.length)
            : null,
        };
      })
      .sort((a, b) => a.readiness - b.readiness)
      .slice(0, EXAMS_LIMIT);
  }

  private computeWeakDomains(sectionAnswers: SectionAnswerRow[], now: number): DashboardWeakDomain[] {
    const cutoff = now - 14 * DAY;
    const bySection = new Map<string, { correct: number; total: number }>();

    for (const answer of sectionAnswers) {
      const finishedAt = answer.attempt.finishedAt;
      if (finishedAt === null || finishedAt.getTime() < cutoff || answer.attempt.timedOut) continue;
      const section = answer.mockExamQuestion.examQuestion.sectionName;
      const current = bySection.get(section) ?? { correct: 0, total: 0 };
      current.correct += answer.isCorrect ? 1 : 0;
      current.total += 1;
      bySection.set(section, current);
    }

    return Array.from(bySection.entries())
      .map(([sectionName, { correct, total }]) => ({
        sectionName,
        accuracy: Math.round((correct / total) * 100),
        questionVolume: total,
      }))
      .filter((domain) => domain.questionVolume >= WEAK_DOMAIN_MIN_VOLUME)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, WEAK_DOMAIN_LIMIT);
  }

  private computeWrongOpenCount(sectionAnswers: SectionAnswerRow[]): number {
    const latestByQuestion = new Map<number, { isCorrect: boolean; finishedAt: number }>();
    for (const answer of sectionAnswers) {
      const id = answer.mockExamQuestion.examQuestionId;
      const finishedAt = answer.attempt.finishedAt?.getTime() ?? 0;
      const current = latestByQuestion.get(id);
      if (!current || finishedAt > current.finishedAt) {
        latestByQuestion.set(id, { isCorrect: answer.isCorrect, finishedAt });
      }
    }

    let count = 0;
    for (const entry of Array.from(latestByQuestion.values())) {
      if (!entry.isCorrect) count += 1;
    }
    return count;
  }

  private computeActivity(
    attempts: AttemptRow[],
    usageLogs: UsageLogRow[],
    autoConfigJobs: AutoConfigRow[],
    exams: ExamRow[],
    now: number
  ): DashboardActivityItem[] {
    const since = now - 7 * DAY;
    const items: DashboardActivityItem[] = [];

    for (const attempt of attempts) {
      if (attempt.finishedAt === null || attempt.finishedAt.getTime() < since) continue;
      items.push({
        kind: 'simulado_finished',
        at: attempt.finishedAt.toISOString(),
        params: {
          name: attempt.mockExam.name ?? attempt.mockExam.exam.name,
          score: attempt.timedOut ? undefined : (accuracyPct(attempt.score, attempt.mockExam._count.questions) ?? 0),
        },
      });
    }

    for (const log of usageLogs) {
      if (log.action !== 'generate_questions' || log.createdAt.getTime() < since) continue;
      items.push({
        kind: 'questions_generated',
        at: log.createdAt.toISOString(),
        params: { count: log.count, name: log.refName ?? undefined },
      });
    }

    for (const job of autoConfigJobs) {
      items.push({
        kind: 'auto_config_done',
        at: job.updatedAt.toISOString(),
        params: { name: job.seedName },
      });
    }

    for (const exam of exams) {
      if (exam.createdAt.getTime() < since) continue;
      items.push({
        kind: 'exam_created',
        at: exam.createdAt.toISOString(),
        params: { name: exam.name },
      });
    }

    return items.sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? 1 : -1)).slice(0, ACTIVITY_LIMIT);
  }
}
