'use client';
import { Chip } from '@heroui/chip';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface StepProgressProps {
  readonly currentStep: 1 | 2 | 3;
}

const STEP_KEYS = ['concurso.step1Title', 'concurso.step2Title', 'concurso.step3Title'] as const;

export function StepProgress({ currentStep }: StepProgressProps) {
  const { t } = useTranslation();
  const percent = Math.round((currentStep / 3) * 100);
  const title = t(STEP_KEYS[currentStep - 1]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-semibold text-foreground">
          {t('concurso.stepProgress', { current: String(currentStep), total: '3', title })}
        </span>
        <Chip color="primary" size="sm" variant="flat">
          <span className="text-xs font-extrabold">{t('concurso.percentComplete', { percent: String(percent) })}</span>
        </Chip>
      </div>
      <div className="w-full h-1.5 bg-default-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
