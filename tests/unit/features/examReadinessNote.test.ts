import { describe, it, expect } from 'vitest';

import { readinessNote } from '@/app/(workspace)/exams/components/list/examReadinessNote';
import type { Exam, ExamReadiness, SectionReadiness } from '@/shared/types';

function section(accuracyPercent: number | null): SectionReadiness {
  return { sectionId: 's', questionCount: 10, targetCount: 10, accuracyPercent };
}

function exam(readiness: Partial<ExamReadiness>, overrides: Partial<Exam> = {}): Exam {
  return {
    type: 'certification',
    name: 'AWS SAA',
    totalQuestions: 40,
    sections: [],
    status: 'active',
    passingScore: 70,
    readiness: {
      phase: 'building_bank',
      projectedPercent: null,
      coveredQuestions: 0,
      targetQuestions: 40,
      sections: [],
      ...readiness,
    },
    ...overrides,
  } as Exam;
}

describe('readinessNote', () => {
  it('RN-08: a completed exam keeps the completed note', () => {
    const note = readinessNote(exam({ phase: 'measured', projectedPercent: 40 }, { status: 'completed' }));

    expect(note).toEqual({ key: 'exam.readinessNoteCompleted' });
  });

  it('RN-08: an exam without sections asks to set up the blueprint', () => {
    expect(readinessNote(exam({ phase: 'no_sections', targetQuestions: 0 }))).toEqual({
      key: 'exam.readinessNoteDraft',
    });
  });

  it('RN-08: while building the bank, says how many questions are missing and offers to generate', () => {
    expect(readinessNote(exam({ coveredQuestions: 18 }))).toEqual({
      key: 'exam.readinessNoteBuilding',
      params: { count: 22 },
      action: 'generate',
    });
  });

  it('RN-08: uses the singular key when a single question is missing', () => {
    expect(readinessNote(exam({ coveredQuestions: 39 }))).toMatchObject({ key: 'exam.readinessNoteBuildingOne' });
  });

  it('RN-08: when the bank is ready, offers the first simulado', () => {
    expect(readinessNote(exam({ phase: 'ready_to_measure', coveredQuestions: 40 }))).toEqual({
      key: 'exam.readinessNoteReady',
      action: 'simulado',
    });
  });

  it('RN-08: untested sections take priority over the distance to the passing score', () => {
    const note = readinessNote(
      exam({ phase: 'measured', projectedPercent: 30, sections: [section(60), section(null), section(null)] })
    );

    expect(note).toEqual({ key: 'exam.readinessNoteUntested', params: { count: 2 } });
  });

  it('RN-08: uses the singular key for a single untested section', () => {
    const note = readinessNote(exam({ phase: 'measured', projectedPercent: 30, sections: [section(60), section(null)] }));

    expect(note).toMatchObject({ key: 'exam.readinessNoteUntestedOne' });
  });

  it('RN-08: below the passing score, says how many points are missing', () => {
    const note = readinessNote(exam({ phase: 'measured', projectedPercent: 47, sections: [section(47)] }));

    expect(note).toEqual({ key: 'exam.readinessNoteBelowCut', params: { delta: 23, cut: 70 } });
  });

  it('RN-08: uses the singular key when one point is missing', () => {
    const note = readinessNote(exam({ phase: 'measured', projectedPercent: 69, sections: [section(69)] }));

    expect(note).toMatchObject({ key: 'exam.readinessNoteBelowCutOne' });
  });

  it('RN-08: at or above the passing score, confirms it', () => {
    const note = readinessNote(exam({ phase: 'measured', projectedPercent: 70, sections: [section(70)] }));

    expect(note).toEqual({ key: 'exam.readinessNoteAboveCut', params: { cut: 70 } });
  });

  it('RN-08: without a passing score, explains the projection', () => {
    const note = readinessNote(
      exam({ phase: 'measured', projectedPercent: 70, sections: [section(70)] }, { passingScore: null })
    );

    expect(note).toEqual({ key: 'exam.readinessNoteNoCut' });
  });
});
