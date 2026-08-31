import { computeTimerState } from '@/features/hooks/useAttemptDeadline.hook';
import {
  formatElapsed,
  formatMMSS,
  formatPerQuestion,
} from '@/app/(workspace)/simulados/[id]/tentativa/[attemptId]/components/attemptFormat';
import {
  AttemptQuestion,
  deriveAttemptState,
} from '@/app/(workspace)/simulados/[id]/tentativa/[attemptId]/components/useAttemptRunner.hook';
import {
  computePauseOffset,
  togglePauseState,
} from '@/app/(workspace)/simulados/[id]/tentativa/[attemptId]/components/useAttemptPause.hook';

function question(overrides: Partial<AttemptQuestion> & { examQuestionId: number }): AttemptQuestion {
  return {
    mockExamQuestionId: overrides.examQuestionId * 10,
    order: overrides.examQuestionId,
    text: `Q${overrides.examQuestionId}`,
    correctCount: 1,
    topic: 'Topic',
    options: { A: 'a', B: 'b', C: 'c', D: 'd' },
    ...overrides,
  };
}

describe('attemptFormat', () => {
  it('formatMMSS pads and clamps', () => {
    expect(formatMMSS(0)).toBe('00:00');
    expect(formatMMSS(-5000)).toBe('00:00');
    expect(formatMMSS(65_000)).toBe('01:05');
    expect(formatMMSS(125 * 60_000)).toBe('125:00');
  });

  it('formatElapsed switches units at one minute and one hour', () => {
    expect(formatElapsed(45_000)).toBe('00:45');
    expect(formatElapsed(12 * 60_000)).toBe('12min');
    expect(formatElapsed(118 * 60_000)).toBe('1h58');
  });

  it('formatPerQuestion divides remaining time by open count, guarding zero', () => {
    expect(formatPerQuestion(600_000, 10)).toBe('01:00');
    expect(formatPerQuestion(600_000, 0)).toBe('10:00');
  });
});

describe('deriveAttemptState', () => {
  const questions = [
    question({ examQuestionId: 1 }),
    question({ examQuestionId: 2 }),
    question({ examQuestionId: 3, correctCount: 2 }),
    question({ examQuestionId: 4 }),
  ];

  it('classifies each navigator cell by priority current > answered > skipped > unvisited', () => {
    const answers = { 1: ['A'], 3: ['A'] }; // q3 needs 2 selections → still open
    const skipped = new Set([2]);
    const state = deriveAttemptState(questions, answers, skipped, 3);

    expect(state.navigatorItems.map((item) => item.status)).toEqual([
      'answered',
      'skipped',
      'unvisited',
      'current',
    ]);
    expect(state.answeredCount).toBe(1);
    expect(state.skippedCount).toBe(1);
    expect(state.openCount).toBe(3);
    expect(state.unvisitedCount).toBe(2);
    expect(state.progressPercent).toBe(25);
  });

  it('counts a multi-answer question as answered only once it meets correctCount', () => {
    const partial = deriveAttemptState(questions, { 3: ['A'] }, new Set(), 0);
    expect(partial.answeredCount).toBe(0);

    const complete = deriveAttemptState(questions, { 3: ['A', 'B'] }, new Set(), 0);
    expect(complete.answeredCount).toBe(1);
  });

  it('a question that was skipped but later answered no longer counts as skipped', () => {
    const state = deriveAttemptState(questions, { 2: ['A'] }, new Set([2]), 0);
    expect(state.skippedCount).toBe(0);
    expect(state.answeredCount).toBe(1);
  });
});

describe('pause offset math', () => {
  it('computePauseOffset freezes while paused and accumulates on resume', () => {
    const start: ReturnType<typeof togglePauseState> = { pausedMs: 0, pausedAt: null };
    expect(computePauseOffset(start, 1_000)).toBe(0);

    const paused = togglePauseState(start, 10_000);
    expect(computePauseOffset(paused, 25_000)).toBe(15_000);

    const resumed = togglePauseState(paused, 30_000);
    expect(resumed).toEqual({ pausedMs: 20_000, pausedAt: null });
    expect(computePauseOffset(resumed, 99_000)).toBe(20_000);
  });

  it('the pause offset keeps the deadline alive past the wall clock', () => {
    const startedAt = new Date('2026-08-31T10:00:00Z').getTime();
    const wallNow = startedAt + 65 * 60_000; // 5 min past a 60-min deadline
    const pausedOffset = 10 * 60_000;

    expect(computeTimerState(startedAt, 60, wallNow).expired).toBe(true);
    expect(computeTimerState(startedAt, 60, wallNow - pausedOffset)).toMatchObject({
      enabled: true,
      expired: false,
      remainingMs: 5 * 60_000,
    });
  });
});
