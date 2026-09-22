import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { prismaMock } from '../__mocks__/prisma';
import { DashboardService } from '@/app/api/dashboard/stats/dashboard.service';

const NOW = new Date('2026-09-09T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);

function attempt(overrides: Partial<{
  id: number;
  mockExamId: number;
  startedAt: Date;
  finishedAt: Date | null;
  score: number | null;
  timedOut: boolean;
  name: string | null;
  examId: string;
  examName: string;
  boardName: string | null;
  durationMinutes: number | null;
  questionCount: number;
  answerCount: number;
}> = {}) {
  const o = {
    id: 1, mockExamId: 1, startedAt: daysAgo(1), finishedAt: daysAgo(1), score: 8, timedOut: false,
    name: 'Simulado 1', examId: 'exam-1', examName: 'AWS SAA', boardName: null,
    durationMinutes: 60, questionCount: 10, answerCount: 10, ...overrides,
  };
  return {
    id: o.id, mockExamId: o.mockExamId, startedAt: o.startedAt, finishedAt: o.finishedAt, score: o.score,
    timedOut: o.timedOut,
    mockExam: {
      name: o.name, examId: o.examId, durationMinutes: o.durationMinutes,
      _count: { questions: o.questionCount },
      exam: { name: o.examName, examBoard: o.boardName ? { name: o.boardName } : null },
    },
    _count: { answers: o.answerCount },
  };
}

function sectionAnswer(examQuestionId: number, sectionName: string, isCorrect: boolean, finishedAt: Date | null) {
  return {
    isCorrect,
    attempt: { finishedAt },
    mockExamQuestion: { examQuestionId, examQuestion: { sectionName } },
  };
}

function setup(opts: {
  attempts?: ReturnType<typeof attempt>[];
  usageLogs?: { action: string; count: number; refName: string | null; createdAt: Date }[];
  exams?: any[];
  questions?: { examId: string | null; sectionId: string | null; topicId: string | null }[];
  sectionAnswers?: ReturnType<typeof sectionAnswer>[];
  autoConfigJobs?: { seedName: string; updatedAt: Date }[];
  mockExamCount?: number;
} = {}) {
  prismaMock.mockExamAttempt.findMany.mockResolvedValue((opts.attempts ?? []) as any);
  prismaMock.usageLog.findMany.mockResolvedValue((opts.usageLogs ?? []) as any);
  prismaMock.exam.findMany.mockResolvedValue((opts.exams ?? []) as any);
  prismaMock.examQuestion.findMany.mockResolvedValue((opts.questions ?? []) as any);
  prismaMock.mockExamAttemptAnswer.findMany.mockResolvedValue((opts.sectionAnswers ?? []) as any);
  prismaMock.autoConfigJob.findMany.mockResolvedValue((opts.autoConfigJobs ?? []) as any);
  prismaMock.mockExam.count.mockResolvedValue(opts.mockExamCount ?? 0);
}

describe('DashboardService.getStats', () => {
  let service: DashboardService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    service = new DashboardService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a fully-zeroed shape for a user with no data', async () => {
    setup();
    const home = await service.getStats('u1');
    expect(home).toEqual({
      kpis: {
        streakDays: 0, questionsThisWeek: 0, questionsWeekDelta: 0,
        avgAccuracy: null, avgAccuracyDelta: null, simuladosTotal: 0, simuladosOpen: 0,
      },
      resume: null,
      examsInProgress: [],
      weakDomains: [],
      quickActions: { bankCount: 0, wrongOpenCount: 0 },
      activity: [],
    });
  });

  it('counts a consecutive-day streak ending today from mixed activity sources', async () => {
    setup({
      attempts: [attempt({ finishedAt: NOW })],
      usageLogs: [
        { action: 'generate_questions', count: 5, refName: 'x', createdAt: daysAgo(1) },
        { action: 'generate_explanation', count: 1, refName: null, createdAt: daysAgo(2) },
      ],
    });
    const home = await service.getStats('u1');
    expect(home.kpis.streakDays).toBe(3);
  });

  it('starts the streak from yesterday when today has no activity, and breaks on a gap', async () => {
    setup({
      usageLogs: [
        { action: 'generate_questions', count: 1, refName: null, createdAt: daysAgo(1) },
        { action: 'generate_questions', count: 1, refName: null, createdAt: daysAgo(2) },
        { action: 'generate_questions', count: 1, refName: null, createdAt: daysAgo(5) },
      ],
    });
    const home = await service.getStats('u1');
    expect(home.kpis.streakDays).toBe(2);
  });

  it('sums answered questions in the 7-day window and the week-over-week delta', async () => {
    setup({
      attempts: [
        attempt({ id: 1, finishedAt: daysAgo(2), answerCount: 20 }),
        attempt({ id: 2, finishedAt: daysAgo(6), answerCount: 15 }),
        attempt({ id: 3, finishedAt: daysAgo(10), answerCount: 12 }),
      ],
    });
    const home = await service.getStats('u1');
    expect(home.kpis.questionsThisWeek).toBe(35);
    expect(home.kpis.questionsWeekDelta).toBe(23);
  });

  it('normalizes score to a percent for avgAccuracy, excludes timedOut attempts, and returns a null delta when the prior window is empty', async () => {
    setup({
      attempts: [
        attempt({ id: 1, finishedAt: daysAgo(3), score: 8, questionCount: 10 }),
        attempt({ id: 2, finishedAt: daysAgo(3), score: 6, questionCount: 10 }),
        attempt({ id: 3, finishedAt: daysAgo(200), score: 5, questionCount: 10 }),
        attempt({ id: 4, finishedAt: daysAgo(3), score: 10, questionCount: 10, timedOut: true }),
      ],
    });
    const home = await service.getStats('u1');
    expect(home.kpis.avgAccuracy).toBe(70);
    expect(home.kpis.avgAccuracyDelta).toBeNull();
  });

  it('computes avgAccuracyDelta against the prior 30-day window', async () => {
    setup({
      attempts: [
        attempt({ id: 1, finishedAt: daysAgo(5), score: 9, questionCount: 10 }),
        attempt({ id: 2, finishedAt: daysAgo(40), score: 6, questionCount: 10 }),
      ],
    });
    const home = await service.getStats('u1');
    expect(home.kpis.avgAccuracy).toBe(90);
    expect(home.kpis.avgAccuracyDelta).toBe(30);
  });

  it('picks the most recently started unfinished attempt as resume', async () => {
    setup({
      attempts: [
        attempt({ id: 10, mockExamId: 3, finishedAt: null, startedAt: daysAgo(1), answerCount: 12, questionCount: 40, name: 'Simulado 04', examName: 'CPA-20', boardName: 'ANBIMA', durationMinutes: 150 }),
        attempt({ id: 11, mockExamId: 4, finishedAt: null, startedAt: daysAgo(3) }),
        attempt({ id: 12, mockExamId: 5, finishedAt: daysAgo(2) }),
      ],
    });
    const home = await service.getStats('u1');
    expect(home.resume).toEqual({
      mockExamId: 3, attemptId: 10, simuladoName: 'Simulado 04', examName: 'CPA-20',
      examBoardName: 'ANBIMA', totalQuestions: 40, answeredQuestions: 12,
      durationMinutes: 150, startedAt: daysAgo(1).toISOString(),
    });
  });

  it('builds examsInProgress from coverage, filters no-activity exams, sorts least-ready first, caps at five, and excludes timedOut attempts from accuracy', async () => {
    setup({
      exams: [
        { id: 'e1', name: 'Ready-ish', type: 'certification', key: 'K1', role: null, year: null, createdAt: daysAgo(40), examBoard: { name: 'B1' }, sections: [{ id: 's1', topics: [{ id: 't1' }, { id: 't2' }] }] },
        { id: 'e2', name: 'Barely started', type: 'public_exam', key: null, role: 'Analista', year: 2026, createdAt: daysAgo(40), examBoard: null, sections: [{ id: 's2', topics: [{ id: 't3' }, { id: 't4' }] }] },
        { id: 'e3', name: 'No activity', type: 'certification', key: null, role: null, year: null, createdAt: daysAgo(40), examBoard: null, sections: [{ id: 's3', topics: [{ id: 't5' }] }] },
        { id: 'e4', name: 'Untouched', type: 'certification', key: null, role: null, year: null, createdAt: daysAgo(40), examBoard: null, sections: [{ id: 's4', topics: [{ id: 't4a' }] }] },
        { id: 'e5', name: 'Quarter covered', type: 'certification', key: null, role: null, year: null, createdAt: daysAgo(40), examBoard: null, sections: [{ id: 's5', topics: [{ id: 't5a' }, { id: 't5b' }, { id: 't5c' }, { id: 't5d' }] }] },
        { id: 'e6', name: 'Third covered', type: 'certification', key: null, role: null, year: null, createdAt: daysAgo(40), examBoard: null, sections: [{ id: 's6', topics: [{ id: 't6a' }, { id: 't6b' }, { id: 't6c' }] }] },
        { id: 'e7', name: 'Also fully covered', type: 'certification', key: null, role: null, year: null, createdAt: daysAgo(40), examBoard: null, sections: [{ id: 's7', topics: [{ id: 't7a' }] }] },
      ],
      questions: [
        { examId: 'e1', sectionId: 's1', topicId: 't1' },
        { examId: 'e1', sectionId: 's1', topicId: 't2' },
        { examId: 'e2', sectionId: 's2', topicId: 't3' },
        { examId: 'e4', sectionId: 's4', topicId: null },
        { examId: 'e5', sectionId: 's5', topicId: 't5a' },
        { examId: 'e6', sectionId: 's6', topicId: 't6a' },
        { examId: 'e7', sectionId: 's7', topicId: 't7a' },
      ],
      attempts: [
        attempt({ id: 1, mockExamId: 1, examId: 'e1', finishedAt: daysAgo(2), score: 7, questionCount: 10 }),
        attempt({ id: 2, mockExamId: 2, examId: 'e1', finishedAt: daysAgo(1), score: 10, questionCount: 10, timedOut: true }),
      ],
    });
    const home = await service.getStats('u1');
    expect(home.examsInProgress).toHaveLength(5);
    expect(home.examsInProgress.map((e) => e.examId)).toEqual(['e4', 'e5', 'e6', 'e2', 'e1']);
    expect(home.examsInProgress.some((e) => e.examId === 'e3')).toBe(false);
    expect(home.examsInProgress.some((e) => e.examId === 'e7')).toBe(false);
    expect(home.examsInProgress.find((e) => e.examId === 'e2')).toMatchObject({ readiness: 50, accuracy: null, boardName: null, keyLabel: 'Analista' });
    expect(home.examsInProgress.find((e) => e.examId === 'e1')).toMatchObject({ readiness: 100, accuracy: 70, boardName: 'B1', keyLabel: 'K1' });
  });

  it('windows weakDomains to 14 days, drops sections under 5 answers, sorts worst first, caps at four', async () => {
    const answers = [
      ...Array.from({ length: 6 }, (_, i) => sectionAnswer(i + 1, 'Fundos', i < 2, daysAgo(3))),
      ...Array.from({ length: 8 }, (_, i) => sectionAnswer(i + 100, 'Ética', i < 6, daysAgo(5))),
      ...Array.from({ length: 6 }, (_, i) => sectionAnswer(i + 200, 'Stale', false, daysAgo(30))),
      sectionAnswer(999, 'Thin', false, daysAgo(1)),
      ...Array.from({ length: 5 }, (_, i) => sectionAnswer(i + 300, 'Direito', i < 1, daysAgo(4))),
      ...Array.from({ length: 5 }, (_, i) => sectionAnswer(i + 400, 'Matemática', i < 4, daysAgo(6))),
      ...Array.from({ length: 5 }, (_, i) => sectionAnswer(i + 500, 'Português', false, daysAgo(2))),
    ];
    setup({ sectionAnswers: answers });
    const home = await service.getStats('u1');
    expect(home.weakDomains).toEqual([
      { sectionName: 'Português', accuracy: 0, questionVolume: 5 },
      { sectionName: 'Direito', accuracy: 20, questionVolume: 5 },
      { sectionName: 'Fundos', accuracy: 33, questionVolume: 6 },
      { sectionName: 'Ética', accuracy: 75, questionVolume: 8 },
    ]);
    expect(home.weakDomains.some((d) => d.sectionName === 'Matemática')).toBe(false);
  });

  it('counts wrongOpenCount as questions wrong and never later right', async () => {
    setup({
      sectionAnswers: [
        sectionAnswer(1, 'A', false, daysAgo(2)),
        sectionAnswer(1, 'A', true, daysAgo(1)),
        sectionAnswer(2, 'A', false, daysAgo(2)),
        sectionAnswer(3, 'B', true, daysAgo(2)),
      ],
      questions: [
        { examId: 'e1', sectionId: 's1', topicId: null },
        { examId: null, sectionId: null, topicId: null },
      ],
    });
    const home = await service.getStats('u1');
    expect(home.quickActions).toEqual({ bankCount: 2, wrongOpenCount: 1 });
  });

  it('merges activity from four sources, newest first, capped at six', async () => {
    setup({
      attempts: [
        attempt({ id: 1, finishedAt: daysAgo(1), score: 8, questionCount: 10, name: 'Sim A', examName: 'Exam A' }),
        attempt({ id: 2, finishedAt: daysAgo(4), score: 5, questionCount: 10, name: 'Sim C', examName: 'Exam C' }),
      ],
      usageLogs: [
        { action: 'generate_questions', count: 30, refName: 'AWS MLA', createdAt: daysAgo(2) },
        { action: 'generate_explanation', count: 1, refName: null, createdAt: daysAgo(2) },
        { action: 'generate_questions', count: 12, refName: 'AWS DVA', createdAt: daysAgo(4.5) },
      ],
      autoConfigJobs: [
        { seedName: 'TRT 4', updatedAt: daysAgo(3) },
        { seedName: 'TRT 5', updatedAt: daysAgo(5) },
      ],
      exams: [
        { id: 'e1', name: 'Novo Exame', type: 'certification', key: null, role: null, year: null, createdAt: daysAgo(3.5), examBoard: null, sections: [] },
        { id: 'e2', name: 'Antigo', type: 'certification', key: null, role: null, year: null, createdAt: daysAgo(30), examBoard: null, sections: [] },
        { id: 'e3', name: 'Exame Y', type: 'certification', key: null, role: null, year: null, createdAt: daysAgo(5.5), examBoard: null, sections: [] },
      ],
    });
    const home = await service.getStats('u1');
    expect(home.activity).toHaveLength(6);
    expect(home.activity.map((a) => a.kind)).toEqual([
      'simulado_finished', 'questions_generated', 'auto_config_done', 'exam_created', 'simulado_finished', 'questions_generated',
    ]);
    expect(home.activity[0]).toEqual({
      kind: 'simulado_finished', at: daysAgo(1).toISOString(), params: { name: 'Sim A', score: 80 },
    });
    expect(home.activity[1].params).toEqual({ count: 30, name: 'AWS MLA' });
    expect(home.activity.some((a) => a.params.name === 'TRT 5')).toBe(false);
    expect(home.activity.some((a) => a.params.name === 'Exame Y')).toBe(false);
  });

  it('omits score from a timed-out attempt in the activity feed instead of reporting 0%', async () => {
    setup({
      attempts: [attempt({ id: 1, finishedAt: daysAgo(1), timedOut: true, score: 9, questionCount: 10, name: 'Sim T' })],
    });
    const home = await service.getStats('u1');
    expect(home.activity).toEqual([
      { kind: 'simulado_finished', at: daysAgo(1).toISOString(), params: { name: 'Sim T', score: undefined } },
    ]);
  });

  it('reports simuladosTotal from the mock-exam count and simuladosOpen from unfinished attempts', async () => {
    setup({
      mockExamCount: 11,
      attempts: [
        attempt({ id: 1, finishedAt: null }),
        attempt({ id: 2, finishedAt: daysAgo(2) }),
      ],
    });
    const home = await service.getStats('u1');
    expect(home.kpis.simuladosTotal).toBe(11);
    expect(home.kpis.simuladosOpen).toBe(1);
  });
});
