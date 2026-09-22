'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { scoreToneText } from '@/shared/lib/scoreTone';
import type { DashboardExamProgress } from '@/shared/types';

interface ExamProgressRowProps {
  readonly exam: DashboardExamProgress;
}

export function ExamProgressRow({ exam }: ExamProgressRowProps) {
  const { t } = useTranslation();
  const meta = [exam.boardName, exam.keyLabel].filter(Boolean).join(' · ');

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_120px_52px] items-center gap-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{exam.name}</p>
        {meta && <p className="mt-0.5 truncate font-mono text-xs text-default-400">{meta}</p>}
      </div>
      <div>
        <div className="h-1.5 rounded-full bg-background overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${exam.readiness}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-default-500">
          {t('dashboard.home.examsReadiness', { value: exam.readiness })}
        </p>
      </div>
      <span
        className={`text-right font-mono text-sm ${exam.accuracy !== null ? scoreToneText(exam.accuracy) : 'text-default-400'}`}
      >
        {exam.accuracy !== null ? `${exam.accuracy}%` : '–'}
      </span>
    </div>
  );
}
