import type { Exam } from '@/shared/types';

export interface ExamDraftValidation {
  readonly hasRequiredFields: boolean;
  readonly hasAtLeastOneSection: boolean;
  readonly isDistributionValid: boolean;
  readonly canSave: boolean;
  readonly distributionSum: number;
}

// Pure function (no React deps, so it's importable from a plain .test.ts) so every
// container (chat-drawer modal, /exams/new, /exams/[id]/edit) gates its own Save button
// on the exact same rule the editor's own warning banner uses — no second copy of "what
// counts as saveable" to drift out of sync.
export function getExamDraftValidation(draft: Exam): ExamDraftValidation {
  const isCertification = draft.type === 'certification';
  const referenceName = isCertification ? (draft.provider?.name ?? '') : (draft.examBoard?.name ?? '');

  const hasRequiredFields = isCertification
    ? draft.name.trim() !== '' &&
      referenceName.trim() !== '' &&
      (draft.key?.trim() ?? '') !== '' &&
      (draft.totalQuestions ?? 0) > 0
    : draft.name.trim() !== '' &&
      referenceName.trim() !== '' &&
      (draft.role?.trim() ?? '') !== '' &&
      (draft.key?.trim() ?? '') !== '' &&
      draft.year != null &&
      (draft.totalQuestions ?? 0) > 0;

  // draft.sections.every(...) is vacuously true on an empty array — without this check,
  // Save stays enabled for an exam with zero sections as soon as the meta fields are filled.
  const hasAtLeastOneSection = draft.sections.length > 0;
  const isDistributionValid = draft.sections.every(
    (section) => section.name.trim() !== '' && section.maxQuestions >= section.minQuestions
  );
  const distributionSum = draft.sections.reduce((sum, section) => sum + section.maxQuestions, 0);

  return {
    hasRequiredFields,
    hasAtLeastOneSection,
    isDistributionValid,
    canSave: hasRequiredFields && hasAtLeastOneSection && isDistributionValid,
    distributionSum,
  };
}
