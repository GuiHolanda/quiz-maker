'use client';
import type { DistributionSumTone } from '@/lib/exam-draft-validation';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { DISTRIBUTION_SUM_TONE_CLASS } from '@/lib/exam-draft-validation';

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

  const rows: { readonly label: string; readonly value: string; readonly valueClass?: string }[] = [
    { label: t('exam.sections'), value: String(sectionCount) },
    { label: t('exam.topics'), value: String(topicCount) },
    {
      label: t('exam.summaryQuestionsPerSimulado'),
      value: totalQuestions > 0 ? String(totalQuestions) : '—',
      valueClass: totalQuestions > 0 ? undefined : 'text-default-400',
    },
    {
      label: t('exam.summaryWeightSum'),
      value: `${Math.round(distributionSum)}%`,
      valueClass: DISTRIBUTION_SUM_TONE_CLASS[distributionSumTone],
    },
  ];

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-5">
      <div className="font-mono text-[11px] uppercase tracking-widest text-default-400">{t('exam.summaryTitle')}</div>
      <dl className="mt-3 flex flex-col">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-2 border-t border-default-200">
            <dt className="text-sm text-default-500">{row.label}</dt>
            <dd className={`font-mono text-[13px] text-right ${row.valueClass ?? 'text-foreground'}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
