'use client';
import type { AutoConfigStage } from '@/shared/types';

import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';

import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface ExamEditorSkeletonProps {
  readonly examName: string;
  readonly provider: string;
  readonly stage?: AutoConfigStage | null;
  readonly onCancel: () => void;
}

const STAGE_KEYS: Record<AutoConfigStage, string> = {
  research: 'exam.aiSeedStageResearch',
  review: 'exam.aiSeedStageReview',
  format: 'exam.aiSeedStageFormat',
};

// Shown the instant a certification/concurso is confirmed (see useExamSeed's
// 'loading-blueprint' state) so the page reads as "filling in", not as a second loading
// screen — the name and provider are already known, only the topic breakdown is still in
// flight. `stage` reflects the auto-config job's current SSE progress event.
export function ExamEditorSkeleton({ examName, provider, stage, onCancel }: ExamEditorSkeletonProps) {
  const { t } = useTranslation();
  const statusKey = stage ? STAGE_KEYS[stage] : 'exam.aiSeedLoadingBlueprint';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button className={buttonStyles.flat} size="sm" onPress={onCancel}>
          {t('common.cancel')}
        </Button>
        <div className="flex items-center gap-2 text-xs text-default-400">
          <Spinner size="sm" />
          {t(statusKey)}
        </div>
      </div>

      <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold text-foreground">{examName}</span>
          <span className="text-sm text-default-500">{provider}</span>
        </div>
        <SkeletonListLoader count={4} height="h-12" />
      </div>
    </div>
  );
}
