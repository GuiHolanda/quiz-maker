'use client';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface StepProgressProps {
  readonly currentStep: 1 | 2 | 3;
}

const STEP_KEYS = [
  'certification.step1Title',
  'certification.step2Title',
  'certification.step3Title',
] as const;

export function StepProgress({ currentStep }: StepProgressProps) {
  const { t } = useTranslation();
  const percent = Math.round((currentStep / 3) * 100);
  const title = t(STEP_KEYS[currentStep - 1]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-semibold text-foreground">
          {t('certification.stepProgress', { current: String(currentStep), total: '3', title })}
        </span>
        <span className="text-xs font-medium text-default-400 uppercase tracking-widest">
          {t('certification.percentComplete', { percent: String(percent) })}
        </span>
      </div>
      <div className="w-full h-1.5 bg-default-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
