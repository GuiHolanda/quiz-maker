import { describe, it, expect } from 'vitest';

import { readinessBar, readinessTone } from '@/shared/lib/examReadiness';
import type { ExamReadiness } from '@/shared/types';

function readiness(overrides: Partial<ExamReadiness>): ExamReadiness {
  return {
    phase: 'building_bank',
    projectedPercent: null,
    coveredQuestions: 0,
    targetQuestions: 40,
    sections: [],
    ...overrides,
  };
}

describe('readinessTone', () => {
  it('RN-07: at or above the passing score is success', () => {
    expect(readinessTone(70, 70)).toBe('success');
    expect(readinessTone(95, 70)).toBe('success');
  });

  it('RN-07: up to 10 points below the passing score is warning', () => {
    expect(readinessTone(60, 70)).toBe('warning');
    expect(readinessTone(69, 70)).toBe('warning');
  });

  it('RN-07: more than 10 points below the passing score is danger', () => {
    expect(readinessTone(59, 70)).toBe('danger');
  });

  it('RN-07: falls back to the fixed 70/50 scale without a passing score', () => {
    expect(readinessTone(72, null)).toBe('success');
    expect(readinessTone(55, null)).toBe('warning');
    expect(readinessTone(30, null)).toBe('danger');
  });
});

describe('readinessBar', () => {
  it('shows bank progress in the brand color while building the bank', () => {
    expect(readinessBar(readiness({ coveredQuestions: 18 }), 70)).toEqual({
      value: 45,
      fillClass: 'bg-primary',
      markerPercent: null,
    });
  });

  it('shows a full brand-colored bar when ready to measure', () => {
    expect(readinessBar(readiness({ phase: 'ready_to_measure', coveredQuestions: 40 }), 70)).toEqual({
      value: 100,
      fillClass: 'bg-primary',
      markerPercent: null,
    });
  });

  it('RN-07: shows the projected score in its tone with a marker at the passing score', () => {
    expect(readinessBar(readiness({ phase: 'measured', projectedPercent: 62 }), 70)).toEqual({
      value: 62,
      fillClass: 'bg-warning',
      markerPercent: 70,
    });
  });

  it('omits the marker when the exam has no passing score', () => {
    expect(readinessBar(readiness({ phase: 'measured', projectedPercent: 80 }), null)).toEqual({
      value: 80,
      fillClass: 'bg-success',
      markerPercent: null,
    });
  });

  it('is empty when the exam has no sections or no readiness', () => {
    const empty = { value: 0, fillClass: 'bg-primary', markerPercent: null };

    expect(readinessBar(readiness({ phase: 'no_sections', targetQuestions: 0 }), 70)).toEqual(empty);
    expect(readinessBar(undefined, 70)).toEqual(empty);
  });
});
