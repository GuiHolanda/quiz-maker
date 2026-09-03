'use client';
import type { Exam, ExamType } from '@/shared/types';
import type { ExamDraftFieldId, ExamDraftValidation } from '@/lib/exam-draft-validation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getDistributionSumTone } from '@/lib/exam-draft-validation';

interface ExamChecklistCardProps {
  readonly draft: Exam;
  readonly validation: ExamDraftValidation;
}

type ChecklistTone = 'success' | 'warning';

interface ChecklistRow {
  readonly key: string;
  readonly tone: ChecklistTone;
  readonly title: string;
  readonly body: string;
}

// Mirrors ExamIdentityFields' cert-vs-concurso label branch — lib/exam-draft-validation.ts
// stays i18n-free and unit-testable in plain Node.
function fieldLabelKey(field: ExamDraftFieldId, type: ExamType): string {
  const isCertification = type === 'certification';

  switch (field) {
    case 'name':
      return 'exam.name';
    case 'key':
      return isCertification ? 'exam.keyLabel' : 'exam.editalKeyLabel';
    case 'reference':
      return isCertification ? 'exam.provider' : 'exam.examBoard';
    case 'role':
      return 'exam.role';
    case 'year':
      return 'exam.year';
    case 'totalQuestions':
      return 'exam.totalQuestions';
  }
}

export function ExamChecklistCard({ draft, validation }: ExamChecklistCardProps) {
  const { t } = useTranslation();
  const {
    hasRequiredFields,
    hasAtLeastOneSection,
    isDistributionValid,
    missingFields,
    sectionCount,
    distributionSum,
    sectionsWithoutTopics,
  } = validation;

  const sumTone = getDistributionSumTone(distributionSum);
  const roundedSum = Math.round(distributionSum);
  const sumBodyKey =
    sumTone === 'ok' ? 'exam.checklistSumOk' : sumTone === 'over' ? 'exam.checklistSumOver' : 'exam.checklistSumLow';

  const rows: ChecklistRow[] = [
    {
      key: 'fields',
      tone: hasRequiredFields ? 'success' : 'warning',
      title: t('exam.checklistFieldsTitle'),
      body: hasRequiredFields
        ? t('exam.checklistFieldsOk')
        : t('exam.checklistFieldsMissing', {
            fields: missingFields.map((field) => t(fieldLabelKey(field, draft.type))).join(', '),
          }),
    },
    {
      key: 'sections',
      tone: hasAtLeastOneSection && isDistributionValid ? 'success' : 'warning',
      title: t('exam.checklistSectionsTitle'),
      body: !hasAtLeastOneSection
        ? t('exam.aiSeedNoSectionsHint')
        : !isDistributionValid
          ? t('exam.distributionInvalidHint')
          : t('exam.checklistSectionsOk', { count: sectionCount }),
    },
    {
      key: 'sum',
      tone: sumTone === 'ok' ? 'success' : 'warning',
      title: t('exam.checklistSumTitle'),
      body: t(sumBodyKey, { sum: roundedSum }),
    },
  ];

  if (sectionsWithoutTopics > 0) {
    rows.push({
      key: 'topics',
      tone: 'warning',
      title: t('exam.checklistTopicsTitle'),
      body: t('exam.checklistTopicsWarn', { count: sectionsWithoutTopics }),
    });
  }

  return (
    <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-5">
      <div className="text-xs font-bold text-default-500 mb-4">{t('exam.checklistTitle')}</div>
      <div className="flex flex-col">
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[22px_1fr] gap-3 items-start py-2">
            <div className="w-[22px] h-[22px] flex items-center justify-center">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  row.tone === 'success' ? 'bg-success/15' : 'bg-warning/15'
                }`}
              >
                <FontAwesomeIcon
                  className={`w-2.5 h-2.5 ${row.tone === 'success' ? 'text-success' : 'text-warning'}`}
                  icon={row.tone === 'success' ? faCheck : faTriangleExclamation}
                />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{row.title}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-default-500 text-pretty">{row.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
