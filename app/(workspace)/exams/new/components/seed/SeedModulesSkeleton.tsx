'use client';

import type { ExamType } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';

interface SeedModulesSkeletonProps {
  readonly type: ExamType;
}

// The blueprint's actual sections only arrive with the job's 'done' event — by then this
// screen has already been swapped for the editor. This stays a skeleton the whole time,
// shaped like the table it's standing in for, rather than faking partial data.
const ROW_WIDTHS_PCT = [72, 58, 66, 50, 80, 62] as const;

export function SeedModulesSkeleton({ type }: SeedModulesSkeletonProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-widest text-default-400">
          {t(EXAM_CONFIG[type].step2SectionsTitle)}
        </div>
        <div className="font-mono text-[11px] text-default-400">{t('exam.loadingModulesPending')}</div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {ROW_WIDTHS_PCT.map((width, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_76px_92px] gap-3 items-center bg-content2 rounded-lg px-3.5 py-2.5 animate-pulse"
          >
            <div className="h-2 rounded-full bg-default-200" style={{ width: `${width}%` }} />
            <div className="font-mono text-[11px] text-default-300 text-right">·</div>
            <div className="font-mono text-[11px] text-default-300 text-right">·</div>
          </div>
        ))}
      </div>
    </div>
  );
}
