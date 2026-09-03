'use client';
import type { DistributionSumTone } from '@/lib/exam-draft-validation';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { KeyValueList, type KeyValueRow, type KeyValueTone } from '@/shared/components/ui/KeyValueList';

const SUM_TONE: Record<DistributionSumTone, KeyValueTone> = {
  over: 'warning',
  low: 'muted',
  ok: 'success',
};

interface ExamSummaryCardProps {
  readonly sectionCount: number;
  readonly topicCount: number;
  // 0 is the "not set yet" sentinel — Exam.totalQuestions is never null/undefined.
  readonly totalQuestions: number;
  readonly distributionSum: number;
  readonly distributionSumTone: DistributionSumTone;
}

export function ExamSummaryCard({
  sectionCount,
  topicCount,
  totalQuestions,
  distributionSum,
  distributionSumTone,
}: ExamSummaryCardProps) {
  const { t } = useTranslation();

  const rows: KeyValueRow[] = [
    { label: t('exam.sections'), value: String(sectionCount) },
    { label: t('exam.topics'), value: String(topicCount) },
    {
      label: t('exam.summaryQuestionsPerSimulado'),
      value: totalQuestions > 0 ? String(totalQuestions) : '—',
      tone: totalQuestions > 0 ? 'default' : 'muted',
    },
    {
      label: t('exam.summaryWeightSum'),
      value: `${Math.round(distributionSum)}%`,
      tone: SUM_TONE[distributionSumTone],
    },
  ];

  return (
    <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-5">
      <div className="text-xs font-bold text-default-500">{t('exam.summaryTitle')}</div>
      <KeyValueList className="mt-3" mono rows={rows} />
    </div>
  );
}
