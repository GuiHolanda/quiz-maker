import { describe, it, expect } from 'vitest';
import {
  blueprintDistribution,
  compareReadinessAscending,
  computeExamReadiness,
  examReadiness,
  groupByExam,
} from '@/lib/exam';
import type { ExamReadiness } from '@/shared/types';

const NOW = new Date('2026-09-26T12:00:00Z');
const minutesAgo = (n: number) => new Date(NOW.getTime() - n * 60_000);

function section(id: string, weight: number) {
  return { id, minQuestions: weight, maxQuestions: weight };
}

function questions(sectionId: string, count: number) {
  return Array.from({ length: count }, () => ({ sectionId }));
}

let nextAnswerId = 1;

function answers(sectionId: string, correct: number, wrong: number, answeredAt = minutesAgo(1)) {
  return [
    ...Array.from({ length: correct }, () => ({ id: nextAnswerId++, sectionId, isCorrect: true, answeredAt })),
    ...Array.from({ length: wrong }, () => ({ id: nextAnswerId++, sectionId, isCorrect: false, answeredAt })),
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

  it('RN-02: weights a section by its max share, like the official simulado', () => {
    const readiness = computeExamReadiness({
      sections: [
        { id: 's1', minQuestions: 10, maxQuestions: 30 },
        { id: 's2', minQuestions: 20, maxQuestions: 20 },
      ],
      totalQuestions: 40,
      questions: [],
      answers: [...answers('s1', 10, 0), ...answers('s2', 0, 10)],
    });

    expect(readiness.sections.map((entry) => entry.targetCount)).toEqual([24, 16]);
    expect(readiness.projectedPercent).toBe(60);
  });

  it('RN-04: targets are the split the official simulado asks for', () => {
    const sections = [
      { id: 's1', minQuestions: 10, maxQuestions: 30 },
      { id: 's2', minQuestions: 30, maxQuestions: 30 },
    ];
    const readiness = computeExamReadiness({ sections, totalQuestions: 50, questions: [], answers: [] });

    expect(readiness.sections.map((entry) => entry.targetCount)).toEqual(blueprintDistribution(sections, 50));
    expect(blueprintDistribution(sections, 50)).toEqual([25, 25]);
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

  it('RN-03: breaks answeredAt ties by the most recent answer id', () => {
    const sameAttempt = minutesAgo(5);
    const readiness = computeExamReadiness({
      sections: [section('s1', 100)],
      totalQuestions: 10,
      questions: [],
      answers: [...answers('s1', 0, 30, sameAttempt), ...answers('s1', 30, 0, sameAttempt)],
    });

    expect(readiness.projectedPercent).toBe(100);
  });

  it('RN-03: ignores answers whose section is not in the blueprint', () => {
    const readiness = computeExamReadiness({
      sections: [section('s1', 100)],
      totalQuestions: 10,
      questions: [{ sectionId: null }, { sectionId: 'gone' }],
      answers: [
        ...answers('gone', 5, 0),
        { id: nextAnswerId++, sectionId: null, isCorrect: true, answeredAt: minutesAgo(1) },
      ],
    });

    expect(readiness.phase).toBe('building_bank');
    expect(readiness.coveredQuestions).toBe(0);
  });
});

describe('blueprintDistribution', () => {
  it('RN-04: splits by max share with the largest remainder, never starving a small section', () => {
    const sections = [
      { minQuestions: 45, maxQuestions: 45 },
      { minQuestions: 45, maxQuestions: 45 },
      { minQuestions: 10, maxQuestions: 10 },
    ];

    expect(blueprintDistribution(sections, 10)).toEqual([5, 4, 1]);
  });

  it('RN-02: splits evenly when every section weighs zero', () => {
    expect(blueprintDistribution([{ maxQuestions: 0 }, { maxQuestions: 0 }], 6)).toEqual([3, 3]);
  });
});

describe('examReadiness', () => {
  const exam = {
    id: 'exam-1',
    name: 'AWS SAA',
    totalQuestions: 10,
    sections: [{ id: 'sec-1', name: 'Segurança  ', minQuestions: 100, maxQuestions: 100 }],
  };

  function ref(
    overrides: Partial<{ examId: string | null; sectionId: string | null; examName: string; sectionName: string }>
  ) {
    return { examId: null, sectionId: null, examName: 'AWS SAA', sectionName: 'Segurança', ...overrides };
  }

  it('RN-03: counts legacy questions without sectionId that match the exam and section by name', () => {
    const readiness = examReadiness(exam, [ref({}), ref({ sectionId: 'sec-1', examId: 'exam-1' })], []);

    expect(readiness.sections[0].questionCount).toBe(2);
  });

  it('RN-03: ignores legacy questions whose exam or section name does not match', () => {
    const readiness = examReadiness(exam, [ref({ examName: 'Other' }), ref({ sectionName: 'Redes' })], []);

    expect(readiness.sections[0].questionCount).toBe(0);
  });

  it('RN-03: measures the exam from answers to legacy questions matched by name', () => {
    const answer = (id: number, isCorrect: boolean) => ({
      id,
      isCorrect,
      answeredAt: minutesAgo(1),
      question: ref({}),
    });
    const readiness = examReadiness(exam, [], [answer(1, true), answer(2, true), answer(3, false), answer(4, true)]);

    expect(readiness).toMatchObject({ phase: 'measured', projectedPercent: 75 });
  });
});

describe('groupByExam', () => {
  const exams = [
    { id: 'exam-1', name: 'AWS SAA' },
    { id: 'exam-2', name: 'CPA-20' },
  ];

  it('groups rows by examId, and rows without sectionId by exam name', () => {
    const rows = [
      { examId: 'exam-1', sectionId: 'sec-1', examName: 'AWS SAA', sectionName: 'A' },
      { examId: null, sectionId: null, examName: 'CPA-20', sectionName: 'B' },
      { examId: 'exam-1', sectionId: null, examName: 'CPA-20', sectionName: 'B' },
      { examId: 'deleted', sectionId: 'sec-9', examName: 'AWS SAA', sectionName: 'A' },
    ];

    const grouped = groupByExam(exams, rows, (row) => row);

    expect(grouped.get('exam-1')).toEqual([rows[0], rows[2]]);
    expect(grouped.get('exam-2')).toEqual([rows[1], rows[2]]);
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
