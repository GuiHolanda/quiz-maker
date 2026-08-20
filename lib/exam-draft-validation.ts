import type { Exam } from '@/shared/types';

// Ids, not i18n keys — this file stays i18n-free and testable in plain Node.
export type ExamDraftFieldId = 'name' | 'key' | 'reference' | 'role' | 'year' | 'totalQuestions';

export interface ExamDraftValidation {
  readonly hasRequiredFields: boolean;
  readonly hasAtLeastOneSection: boolean;
  readonly isDistributionValid: boolean;
  readonly canSave: boolean;
  readonly distributionSum: number;
  readonly missingFields: readonly ExamDraftFieldId[];
  readonly sectionCount: number;
  readonly topicCount: number;
  readonly sectionsWithoutTopics: number;
}

export type DistributionSumTone = 'over' | 'low' | 'ok';

// Over 100% still generates (normalized); comfortably under 100% usually means a gap.
export function getDistributionSumTone(sum: number): DistributionSumTone {
  if (sum > 100) return 'over';
  if (sum < 90) return 'low';

  return 'ok';
}

// Shared by every surface that renders a distribution-sum figure, so the color scale can't drift.
export const DISTRIBUTION_SUM_TONE_CLASS: Record<DistributionSumTone, string> = {
  over: 'text-warning',
  low: 'text-default-400',
  ok: 'text-success',
};

// Pure function so every container (modal, /exams/new, /exams/[id]/edit) gates Save on the
// exact same rule — no second copy of "what counts as saveable" to drift out of sync.
export function getExamDraftValidation(draft: Exam): ExamDraftValidation {
  const isCertification = draft.type === 'certification';
  const referenceName = isCertification ? (draft.provider?.name ?? '') : (draft.examBoard?.name ?? '');

  const missingFields: ExamDraftFieldId[] = [];

  if (draft.name.trim() === '') missingFields.push('name');
  if ((draft.key?.trim() ?? '') === '') missingFields.push('key');
  if (referenceName.trim() === '') missingFields.push('reference');
  if (!isCertification && (draft.role?.trim() ?? '') === '') missingFields.push('role');
  if (!isCertification && draft.year == null) missingFields.push('year');
  if ((draft.totalQuestions ?? 0) <= 0) missingFields.push('totalQuestions');

  // Derived from missingFields, not an independent expression, so the two can't drift apart.
  const hasRequiredFields = missingFields.length === 0;

  // .every() is vacuously true on an empty array — this guards against 0 sections passing.
  const hasAtLeastOneSection = draft.sections.length > 0;
  const isDistributionValid = draft.sections.every(
    (section) => section.name.trim() !== '' && section.maxQuestions >= section.minQuestions
  );
  const distributionSum = draft.sections.reduce((sum, section) => sum + section.maxQuestions, 0);

  const topicCount = draft.sections.reduce((sum, section) => sum + (section.topics ?? []).length, 0);
  const sectionsWithoutTopics = draft.sections.filter((section) => (section.topics ?? []).length === 0).length;

  return {
    hasRequiredFields,
    hasAtLeastOneSection,
    isDistributionValid,
    canSave: hasRequiredFields && hasAtLeastOneSection && isDistributionValid,
    distributionSum,
    missingFields,
    sectionCount: draft.sections.length,
    topicCount,
    sectionsWithoutTopics,
  };
}
