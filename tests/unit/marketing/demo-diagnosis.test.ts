import {
  buildDiagnosis,
  parsePassingPct,
  DEFAULT_PASSING_PCT,
} from '@/app/(marketing)/components/demo/demoDiagnosis';
import type { DemoQuestion } from '@/shared/types';

function makeQuestion(topic: string, correctIndexes: number[]): DemoQuestion {
  return {
    text: `Question about ${topic}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndexes,
    topic,
    explanation: 'Because.',
  };
}

describe('parsePassingPct', () => {
  it('parses a percentage string', () => {
    expect(parsePassingPct('72%')).toBe(72);
  });

  it('falls back when the template carries no passing score', () => {
    expect(parsePassingPct('')).toBe(DEFAULT_PASSING_PCT);
  });
});

describe('buildDiagnosis', () => {
  const questions = [
    makeQuestion('Networking', [0]),
    makeQuestion('Networking', [1]),
    makeQuestion('Security', [2]),
    makeQuestion('Security', [0, 1]),
  ];

  it('scores each question once and exposes the per-question verdict', () => {
    const diagnosis = buildDiagnosis(questions, { 0: [0], 1: [3], 2: [2], 3: [0, 1] }, 70);

    expect(diagnosis.results).toEqual([true, false, true, true]);
    expect(diagnosis.hits).toBe(3);
    expect(diagnosis.errors).toBe(1);
    expect(diagnosis.scorePct).toBe(75);
    expect(diagnosis.passed).toBe(true);
  });

  it('requires an exact set match on multiple-answer questions', () => {
    const diagnosis = buildDiagnosis(questions, { 0: [0], 1: [1], 2: [2], 3: [0] }, 70);

    expect(diagnosis.results[3]).toBe(false);
  });

  it('treats an unanswered question as incorrect', () => {
    const diagnosis = buildDiagnosis(questions, {}, 70);

    expect(diagnosis.hits).toBe(0);
    expect(diagnosis.scorePct).toBe(0);
    expect(diagnosis.passed).toBe(false);
  });

  it('aggregates per topic and sorts weakest first', () => {
    const diagnosis = buildDiagnosis(questions, { 0: [0], 1: [1], 2: [3], 3: [3] }, 70);

    expect(diagnosis.topics.map((topic) => topic.topic)).toEqual(['Security', 'Networking']);
    expect(diagnosis.topics[0]).toMatchObject({ topic: 'Security', correct: 0, total: 2, pct: 0 });
    expect(diagnosis.topics[1]).toMatchObject({ topic: 'Networking', correct: 2, total: 2, pct: 100 });
  });

  it('classifies mastery against the exam passing score', () => {
    const diagnosis = buildDiagnosis(questions, { 0: [0], 1: [1], 2: [3], 3: [3] }, 70);

    expect(diagnosis.topics.find((topic) => topic.topic === 'Networking')?.mastery).toBe('mastered');
    expect(diagnosis.topics.find((topic) => topic.topic === 'Security')?.mastery).toBe('priority');
  });

  it('marks a topic between 50% and the cutline as shaky', () => {
    const twoPerTopic = [makeQuestion('Storage', [0]), makeQuestion('Storage', [1])];
    const diagnosis = buildDiagnosis(twoPerTopic, { 0: [0], 1: [3] }, 70);

    expect(diagnosis.topics[0]).toMatchObject({ pct: 50, mastery: 'shaky' });
  });

  it('lists every non-mastered topic as weak', () => {
    const diagnosis = buildDiagnosis(questions, { 0: [0], 1: [1], 2: [3], 3: [3] }, 70);

    expect(diagnosis.weakTopics.map((topic) => topic.topic)).toEqual(['Security']);
  });

  it('handles an empty question set without dividing by zero', () => {
    const diagnosis = buildDiagnosis([], {}, 70);

    expect(diagnosis.scorePct).toBe(0);
    expect(diagnosis.topics).toEqual([]);
  });
});
