import type { DemoQuestion } from '@/shared/types';
import { isAnswerCorrect } from './demoScoring';

export const DEFAULT_PASSING_PCT = 70;
const SHAKY_FLOOR_PCT = 50;

export type TopicMastery = 'mastered' | 'shaky' | 'priority';

export interface TopicResult {
  readonly topic: string;
  readonly correct: number;
  readonly total: number;
  readonly pct: number;
  readonly mastery: TopicMastery;
}

export interface Diagnosis {
  readonly hits: number;
  readonly total: number;
  readonly errors: number;
  readonly scorePct: number;
  readonly passingPct: number;
  readonly passed: boolean;
  // Index-aligned with `questions`, so the review can read a verdict per question
  // instead of re-scoring it while rendering.
  readonly results: readonly boolean[];
  readonly topics: readonly TopicResult[];
  readonly weakTopics: readonly TopicResult[];
}

// Templates may carry no passing score; callers get a sane default rather than NaN.
export function parsePassingPct(passing: string): number {
  const parsed = Number.parseInt(passing, 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_PASSING_PCT;
}

function classify(pct: number, passingPct: number): TopicMastery {
  if (pct >= passingPct) return 'mastered';
  return pct >= SHAKY_FLOOR_PCT ? 'shaky' : 'priority';
}

// Scores every question once and derives all the panel's numbers from that pass.
export function buildDiagnosis(
  questions: readonly DemoQuestion[],
  answers: Record<string, number[]>,
  passingPct: number
): Diagnosis {
  const results = questions.map((question, index) => isAnswerCorrect(answers[index], question.correctIndexes));

  const hits = results.filter(Boolean).length;
  const total = questions.length;
  const scorePct = total === 0 ? 0 : Math.round((hits / total) * 100);

  const tally = new Map<string, { correct: number; total: number }>();

  questions.forEach((question, index) => {
    const entry = tally.get(question.topic) ?? { correct: 0, total: 0 };

    entry.total += 1;
    if (results[index]) entry.correct += 1;
    tally.set(question.topic, entry);
  });

  const topics = Array.from(tally.entries())
    .map(([topic, entry]) => {
      const pct = Math.round((entry.correct / entry.total) * 100);
      return { topic, correct: entry.correct, total: entry.total, pct, mastery: classify(pct, passingPct) };
    })
    .sort((a, b) => a.pct - b.pct);

  return {
    hits,
    total,
    errors: total - hits,
    scorePct,
    passingPct,
    passed: scorePct >= passingPct,
    results,
    topics,
    weakTopics: topics.filter((topic) => topic.mastery !== 'mastered'),
  };
}
