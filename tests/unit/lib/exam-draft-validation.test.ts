import { getExamDraftValidation, getDistributionSumTone } from '@/lib/exam-draft-validation';
import type { Exam } from '@/shared/types';

// Regression: an empty sections array made `sections.every(...)` vacuously true, so an
// exam with zero sections could still pass validation and enable Save.

const baseCertification: Exam = {
  type: 'certification',
  name: 'AWS Certified AI Practitioner',
  key: 'AIF-C01',
  totalQuestions: 65,
  provider: { name: 'AWS' },
  examBoard: null,
  sections: [],
};

const basePublicExam: Exam = {
  type: 'public_exam',
  name: 'Concurso TRT',
  key: '001/2025',
  role: 'Analista',
  year: 2025,
  totalQuestions: 80,
  provider: null,
  examBoard: { name: 'Cebraspe' },
  sections: [],
};

describe('getExamDraftValidation', () => {
  it('blocks save when there are no sections, even with every other field filled', () => {
    const result = getExamDraftValidation(baseCertification);

    expect(result.hasRequiredFields).toBe(true);
    expect(result.hasAtLeastOneSection).toBe(false);
    expect(result.canSave).toBe(false);
  });

  it('allows save once at least one valid section exists', () => {
    const draft: Exam = {
      ...baseCertification,
      sections: [{ name: 'Fundamentals', minQuestions: 0, maxQuestions: 100 }],
    };
    const result = getExamDraftValidation(draft);

    expect(result.hasAtLeastOneSection).toBe(true);
    expect(result.isDistributionValid).toBe(true);
    expect(result.canSave).toBe(true);
  });

  it('flags a section with an empty name as an invalid distribution', () => {
    const draft: Exam = {
      ...baseCertification,
      sections: [{ name: '', minQuestions: 0, maxQuestions: 100 }],
    };
    const result = getExamDraftValidation(draft);

    expect(result.hasAtLeastOneSection).toBe(true);
    expect(result.isDistributionValid).toBe(false);
    expect(result.canSave).toBe(false);
  });

  it('flags a section where max is below min as an invalid distribution', () => {
    const draft: Exam = {
      ...baseCertification,
      sections: [{ name: 'Fundamentals', minQuestions: 50, maxQuestions: 10 }],
    };
    const result = getExamDraftValidation(draft);

    expect(result.isDistributionValid).toBe(false);
  });

  it('does not require the distribution to sum to 100 — only a warning, not a block', () => {
    const draft: Exam = {
      ...baseCertification,
      sections: [{ name: 'Fundamentals', minQuestions: 0, maxQuestions: 40 }],
    };
    const result = getExamDraftValidation(draft);

    expect(result.distributionSum).toBe(40);
    expect(result.isDistributionValid).toBe(true);
    expect(result.canSave).toBe(true);
  });

  it('requires role, key, and year for a public exam but not for a certification', () => {
    const missingRole: Exam = { ...basePublicExam, role: null };
    const missingYear: Exam = { ...basePublicExam, year: null };

    expect(getExamDraftValidation(missingRole).hasRequiredFields).toBe(false);
    expect(getExamDraftValidation(missingYear).hasRequiredFields).toBe(false);
    expect(getExamDraftValidation(baseCertification).hasRequiredFields).toBe(true);
  });

  it('requires totalQuestions to be a positive number', () => {
    const draft: Exam = { ...baseCertification, totalQuestions: 0 };

    expect(getExamDraftValidation(draft).hasRequiredFields).toBe(false);
  });

  it('reports no missing fields when a certification draft is complete', () => {
    expect(getExamDraftValidation(baseCertification).missingFields).toEqual([]);
  });

  it('lists missing fields in canvas order', () => {
    const draft: Exam = { ...baseCertification, name: '', key: null };

    expect(getExamDraftValidation(draft).missingFields).toEqual(['name', 'key']);
  });

  it('never reports role or year as missing for a certification', () => {
    const draft: Exam = { ...baseCertification, role: null, year: null };

    expect(getExamDraftValidation(draft).missingFields).not.toContain('role');
    expect(getExamDraftValidation(draft).missingFields).not.toContain('year');
  });

  it('reports role and year as missing for a public exam that lacks them', () => {
    const draft: Exam = { ...basePublicExam, role: null, year: null };

    expect(getExamDraftValidation(draft).missingFields).toEqual(['role', 'year']);
  });

  it('reads the `reference` field from provider for certifications and examBoard for public exams', () => {
    const missingProvider: Exam = { ...baseCertification, provider: null };
    const missingExamBoard: Exam = { ...basePublicExam, examBoard: null };

    expect(getExamDraftValidation(missingProvider).missingFields).toContain('reference');
    expect(getExamDraftValidation(missingExamBoard).missingFields).toContain('reference');
  });

  it('keeps hasRequiredFields in sync with missingFields being empty', () => {
    const complete = getExamDraftValidation(basePublicExam);
    const incomplete = getExamDraftValidation({ ...basePublicExam, role: null });

    expect(complete.missingFields).toEqual([]);
    expect(complete.hasRequiredFields).toBe(true);
    expect(incomplete.missingFields.length).toBeGreaterThan(0);
    expect(incomplete.hasRequiredFields).toBe(false);
  });

  it('counts sections, topics, and sections with no topics — a missing topics array counts as zero', () => {
    const draft: Exam = {
      ...baseCertification,
      sections: [
        { name: 'Fundamentals', minQuestions: 0, maxQuestions: 50, topics: [{ name: 'A' }, { name: 'B' }] },
        { name: 'Advanced', minQuestions: 0, maxQuestions: 50, topics: [] },
        { name: 'Extra', minQuestions: 0, maxQuestions: 0 },
      ],
    };
    const result = getExamDraftValidation(draft);

    expect(result.sectionCount).toBe(3);
    expect(result.topicCount).toBe(2);
    expect(result.sectionsWithoutTopics).toBe(2);
  });

  it('classifies the distribution sum into over/low/ok bands', () => {
    expect(getDistributionSumTone(0)).toBe('low');
    expect(getDistributionSumTone(89)).toBe('low');
    expect(getDistributionSumTone(90)).toBe('ok');
    expect(getDistributionSumTone(100)).toBe('ok');
    expect(getDistributionSumTone(101)).toBe('over');
  });
});
