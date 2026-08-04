'use client';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';

import { StepProgress } from './StepProgress';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface StepHeaderProps {
  readonly currentStep: 1 | 2 | 3;
  readonly namespace: 'certification' | 'concurso';
  readonly onBack?: () => void;
}

const BACK_LABEL_SUFFIX = {
  1: 'backToLibrary',
  2: 'backToStep1',
  3: 'backToStep2',
} as const;

export function StepHeader({ currentStep, namespace, onBack }: StepHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {onBack && currentStep > 1 && (
        <Button
          className="text-xs font-semibold text-primary w-fit px-0 min-w-0 h-auto data-[hover=true]:opacity-80 bg-transparent"
          startContent={<FontAwesomeIcon className="text-sm" icon={faArrowLeft} />}
          variant="light"
          onPress={onBack}
        >
          {t(`${namespace}.${BACK_LABEL_SUFFIX[currentStep]}`)}
        </Button>
      )}
      <StepProgress currentStep={currentStep} namespace={namespace} />
    </div>
  );
}
