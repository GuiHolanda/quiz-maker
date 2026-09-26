import { describe, it, expect } from 'vitest';
import { compareReadinessAscending, computeExamReadiness } from '@/lib/exam';
import type { ExamReadiness } from '@/shared/types';

const NOW = new Date('2026-09-26T12:00:00Z');
const minutesAgo = (n: number) => new Date(NOW.getTime() - n * 60_000);

function section(id: string, weight: number) {
  return { id, minQuestions: weight, maxQuestions: weight };
}

function questions(sectionId: string, count: number) {
  return Array.from({ length: count }, () => ({ sectionId }));
}

function answers(sectionId: string, correct: number, wrong: number, answeredAt = minutesAgo(1)) {
  return [
    ...Array.from({ length: correct }, () => ({ sectionId, isCorrect: true, answeredAt })),
    ...Array.from({ length: wrong }, () => ({ sectionId, isCorrect: false, answeredAt })),
  ];
}

describe('computeExamReadiness', () => {
  it('RN-05: an exam without sections is in the no_sections phase', () => {
    const readiness = computeExamReadiness({ sections: [], totalQuestions: 40, questions: [], answers: [] });

    expect(readiness).toEqual({
      phase: 'no_sections',
      projectedPercent: null,
      coveredQuestions: 0,
      targetQuestions: 0,
      sections: [],
    });
  });

  it('RN-04: splits totalQuestions across sections by blueprint weight', () => {
    const readiness = computeExamReadiness({
      sections: [section('s1', 50), section('s2', 30), section('s3', 20)],
      totalQuestions: 40,
      questions: [],
      answers: [],
    });

    expect(readiness.sections.map((entry) => entry.targetCount)).toEqual([20, 12, 8]);
    expect(readiness.targetQuestions).toBe(40);
  });

  it('RN-02: weights a section by the midpoint of its min and max share', () => {
    const readiness = computeExamReadiness({
      sections: [
        { id: 's1', minQuestions: 10, maxQuestions: 30 },
        { id: 's2', minQuestions: 20, maxQuestions: 20 },
      ],
      totalQuestions: 40,
      questions: [],
      answers: [],
    });

    expect(readiness.sections.map((entry) => entry.targetCount)).toEqual([20, 20]);
  });

  it('RN-02: falls back to equal weights when every section weighs zero', () => {
    const readiness = computeExamReadiness({
      sections: [section('s1', 0), section('s2', 0)],
      totalQuestions: 10,
      questions: questions('s1', 5),
      answers: answers('s1', 5, 0),
    });

    expect(readiness.sections.map((entry) => entry.targetCount)).toEqual([5, 5]);
    expect(readiness.projectedPercent).toBe(50);
  });

  it('RN-05: stays in building_bank while any section is below its target', () => {
    const readiness = computeExamReadiness({
      sections: [section('s1', 50), section('s2', 50)],
      totalQuestions: 20,
      questions: [...questions('s1', 10), ...questions('s2', 4)],
      answers: [],
    });

    expect(readiness.phase).toBe('building_bank');
    expect(readiness.projectedPercent).toBeNull();
    expect(readiness.coveredQuestions).toBe(14);
    expect(readiness.targetQuestions).toBe(20);
  });

  it('RN-06: surplus questions in one section do not make up for another', () => {
    const readiness = computeExamReadiness({
      sections: [section('s1', 50), section('s2', 50)],
      totalQuestions: 20,
      questions: questions('s1', 30),
      answers: [],
    });

    expect(readiness.phase).toBe('building_bank');
    expect(readiness.coveredQuestions).toBe(10);
    expect(readiness.sections[0]).toMatchObject({ sectionId: 's1', questionCount: 30, targetCount: 10 });
  });

  it('RN-05: is ready_to_measure once every section reaches its target and nothing was answered', () => {
    const readiness = computeExamReadiness({
      sections: [section('s1', 50), section('s2', 50)],
      totalQuestions: 20,
      questions: [...questions('s1', 10), ...questions('s2', 12)],
      answers: [],
    });

    expect(readiness.phase).toBe('ready_to_measure');
    expect(readiness.projectedPercent).toBeNull();
    expect(readiness.coveredQuestions).toBe(20);
  });

  it('RN-05: is measured as soon as one section has an answer, even with the bank incomplete', () => {
    const readiness = computeExamReadiness({
      sections: [section('s1', 50), section('s2', 50)],
      totalQuestions: 20,
      questions: questions('s1', 3),
      answers: answers('s1', 2, 1),
    });

    expect(readiness.phase).toBe('measured');
  });

  it('RN-01: projects the score as accuracy weighted by blueprint, untested sections counting as zero', () => {
    const readiness = computeExamReadiness({
      sections: [section('s1', 60), section('s2', 25), section('s3', 15)],
      totalQuestions: 20,
      questions: [],
      answers: [...answers('s1', 8, 2), ...answers('s2', 1, 3)],
    });

    expect(readiness.sections.map((entry) => entry.accuracyPercent)).toEqual([80, 25, null]);
    expect(readiness.projectedPercent).toBe(54);
  });

  it('RN-03: only the 30 most recent answers of a section count', () => {
    const readiness = computeExamReadiness({
      sections: [section('s1', 100)],
      totalQuestions: 10,
      questions: [],
      answers: [...answers('s1', 0, 20, minutesAgo(60)), ...answers('s1', 30, 0, minutesAgo(5))],
    });

    expect(readiness.projectedPercent).toBe(100);
  });

  it('RN-03: ignores answers whose section is not in the blueprint', () => {
    const readiness = computeExamReadiness({
      sections: [section('s1', 100)],
      totalQuestions: 10,
      questions: [{ sectionId: null }, { sectionId: 'gone' }],
      answers: [...answers('gone', 5, 0), { sectionId: null, isCorrect: true, answeredAt: minutesAgo(1) }],
    });

    expect(readiness.phase).toBe('building_bank');
    expect(readiness.coveredQuestions).toBe(0);
  });
});

describe('compareReadinessAscending', () => {
  const readiness = (overrides: Partial<ExamReadiness>): ExamReadiness => ({
    phase: 'building_bank',
    projectedPercent: null,
    coveredQuestions: 0,
    targetQuestions: 10,
    sections: [],
    ...overrides,
  });

  const noSections = readiness({ phase: 'no_sections', targetQuestions: 0 });
  const bankLow = readiness({ coveredQuestions: 2 });
  const bankHigh = readiness({ coveredQuestions: 8 });
  const ready = readiness({ phase: 'ready_to_measure', coveredQuestions: 10 });
  const measuredLow = readiness({ phase: 'measured', projectedPercent: 5 });
  const measuredHigh = readiness({ phase: 'measured', projectedPercent: 90 });

  it('RN-09: orders no sections, then unmeasured by bank progress, then measured by projected score', () => {
    const sorted = [measuredHigh, ready, noSections, measuredLow, bankHigh, bankLow].sort(compareReadinessAscending);

    expect(sorted).toEqual([noSections, bankLow, bankHigh, ready, measuredLow, measuredHigh]);
  });

  it('RN-09: treats a missing readiness like an exam without sections', () => {
    expect(compareReadinessAscending(undefined, bankLow)).toBeLessThan(0);
    expect(compareReadinessAscending(noSections, undefined)).toBe(0);
  });
});
