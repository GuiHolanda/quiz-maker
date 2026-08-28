import { deriveResult } from '@/app/(workspace)/simulados/[id]/resultado/[attemptId]/components/deriveResult';
import type { MockExamResult } from '@/shared/types';

interface ResultOverrides {
  timedOut?: boolean;
  durationMinutes?: number | null;
  attemptDurationMinutes?: number | null;
  passingScorePercent?: number | null;
  score?: number;
}

function makeResult(overrides: ResultOverrides = {}): MockExamResult {
  const total = 10;
  const score = overrides.score ?? 8;

  const questions = Array.from({ length: total }, (_, index) => ({
    id: index + 1,
    order: index,
    examQuestion: {
      id: index + 1,
      sectionName: 'S1',
      topic: null,
      text: `Q${index + 1}`,
      options: { A: 'a', B: 'b' },
      answer: { correctOptions: ['A'], explanations: [] },
    },
  }));

  const answers = questions.slice(0, score).map((question) => ({
    mockExamQuestionId: question.id,
    selectedOptions: ['A'],
  }));

  const durationMinutes = overrides.durationMinutes === undefined ? 60 : overrides.durationMinutes;
  const attemptDurationMinutes =
    overrides.attemptDurationMinutes === undefined ? durationMinutes : overrides.attemptDurationMinutes;

  return {
    attempt: {
      id: 1,
      mockExamId: 1,
      startedAt: '2026-08-27T10:00:00Z',
      finishedAt: '2026-08-27T10:30:00Z',
      score,
      timedOut: overrides.timedOut ?? false,
      answers,
    },
    mockExam: { id: 1, name: 'Mock', exam: { id: 'e1', name: 'AWS', type: 'certification' } },
    questions,
    sectionBreakdown: [{ sectionName: 'S1', correct: score, total, weightPercent: 100, previousAvgPercent: null }],
    examMeta: {
      passingScorePercent: overrides.passingScorePercent === undefined ? 70 : overrides.passingScorePercent,
      durationMinutes,
      attemptDurationMinutes,
    },
    attemptNumber: 1,
    totalAttempts: 1,
    overallPreviousAvgPercent: null,
  } as unknown as MockExamResult;
}

describe('deriveResult — comparable gating', () => {
  it('timedOut attempt is not comparable and drops cut-relative fields', () => {
    const view = deriveResult(makeResult({ timedOut: true }));

    expect(view.timedOut).toBe(true);
    expect(view.comparable).toBe(false);
    expect(view.passed).toBeNull();
    expect(view.marginPP).toBeNull();
  });

  it('attempt without a time budget is not comparable', () => {
    const view = deriveResult(makeResult({ timedOut: false, durationMinutes: null }));

    expect(view.comparable).toBe(false);
    expect(view.passed).toBeNull();
    expect(view.marginPP).toBeNull();
  });

  it('livre simulado is not comparable even when the exam has an official duration', () => {
    const view = deriveResult(
      makeResult({ timedOut: false, durationMinutes: 130, attemptDurationMinutes: null, passingScorePercent: 70 })
    );

    expect(view.comparable).toBe(false);
    expect(view.passed).toBeNull();
    expect(view.marginPP).toBeNull();
  });

  it('timed, non-timedOut attempt is comparable and passes when percent >= cut', () => {
    const view = deriveResult(makeResult({ timedOut: false, durationMinutes: 60, score: 8, passingScorePercent: 70 }));

    expect(view.comparable).toBe(true);
    expect(view.percent).toBe(80);
    expect(view.passed).toBe(true);
    expect(view.marginPP).toBe(10);
  });

  it('livre simulado has no attempt time budget even when the exam has an official duration', () => {
    const view = deriveResult(
      makeResult({ timedOut: false, durationMinutes: 130, attemptDurationMinutes: null })
    );

    expect(view.attemptDurationMinutes).toBeNull();
    expect(view.durationLabel).not.toBeNull();
  });

  it('timed attempt carries its budget through as attemptDurationMinutes', () => {
    const view = deriveResult(makeResult({ timedOut: false, durationMinutes: 60 }));

    expect(view.attemptDurationMinutes).toBe(60);
  });

  it('comparable attempt fails when percent is below the cut', () => {
    const view = deriveResult(makeResult({ timedOut: false, durationMinutes: 60, score: 5, passingScorePercent: 70 }));

    expect(view.comparable).toBe(true);
    expect(view.percent).toBe(50);
    expect(view.passed).toBe(false);
    expect(view.marginPP).toBe(-20);
  });
});
