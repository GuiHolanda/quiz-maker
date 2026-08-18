import { getExamDraftValidation } from '@/lib/exam-draft-validation';
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
});
