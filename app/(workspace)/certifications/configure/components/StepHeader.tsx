'use client';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';

import { StepProgress } from './StepProgress';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface StepHeaderProps {
  readonly currentStep: 1 | 2 | 3;
  readonly onBack?: () => void;
}

const BACK_LABEL_KEYS = {
  1: 'certification.backToLibrary',
  2: 'certification.backToStep1',
  3: 'certification.backToStep2',
} as const;

const SUBTITLE_KEYS = {
  1: 'certification.step1Description',
  2: 'certification.step2Description',
  3: 'certification.step3Description',
} as const;

export function StepHeader({ currentStep, onBack }: StepHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {onBack && (
        <Button
          className="text-xs font-semibold text-primary w-fit px-0 min-w-0 h-auto data-[hover=true]:opacity-80 bg-transparent"
          startContent={<FontAwesomeIcon className="text-sm" icon={faArrowLeft} />}
          variant="light"
          onPress={onBack}
        >
          {t(BACK_LABEL_KEYS[currentStep])}
        </Button>
      )}
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold">{t('certification.createNewTitle')}</h1>
        <p className="page-header-subtitle mt-1">{t(SUBTITLE_KEYS[currentStep])}</p>
      </div>
      <StepProgress currentStep={currentStep} />
    </div>
  );
}
