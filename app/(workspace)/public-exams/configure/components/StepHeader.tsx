'use client';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { StepProgress } from './StepProgress';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface StepHeaderProps {
  readonly currentStep: 1 | 2 | 3;
  readonly onBack?: () => void;
}

const BACK_LABEL_KEYS = {
  1: 'concurso.backToLibrary',
  2: 'concurso.backToStep1',
  3: 'concurso.backToStep2',
} as const;

const SUBTITLE_KEYS = {
  1: 'concurso.step1Description',
  2: 'concurso.step2Description',
  3: 'concurso.step3Description',
} as const;

export function StepHeader({ currentStep, onBack }: StepHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {onBack && (
        <button
          className="flex items-center gap-2 text-xs font-semibold text-primary w-fit hover:opacity-80 transition-opacity cursor-pointer"
          onClick={onBack}
        >
          <FontAwesomeIcon className="text-sm" icon={faArrowLeft} />
          {t(BACK_LABEL_KEYS[currentStep])}
        </button>
      )}
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold">{t('concurso.createNewTitle')}</h1>
        <p className="page-header-subtitle mt-1">{t(SUBTITLE_KEYS[currentStep])}</p>
      </div>
      <StepProgress currentStep={currentStep} />
    </div>
  );
}
