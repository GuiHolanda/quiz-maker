'use client';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { ExamType } from '@/shared/types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faLandmark } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface ScopePickerProps {
  readonly value: ExamType;
  readonly onChange: (value: ExamType) => void;
}

const FIELD_LABEL = 'text-xs font-semibold text-default-400';

export function ScopePicker({ value, onChange }: ScopePickerProps) {
  const { t } = useTranslation();

  const options: { scope: ExamType; icon: IconDefinition; title: string; body: string; testId: string }[] = [
    {
      scope: 'certification',
      icon: faGraduationCap,
      title: t('simulado.create.scopeCertificationTitle'),
      body: t('simulado.create.scopeCertificationBody'),
      testId: 'simulado-scope-certification',
    },
    {
      scope: 'public_exam',
      icon: faLandmark,
      title: t('simulado.create.scopeConcursoTitle'),
      body: t('simulado.create.scopeConcursoBody'),
      testId: 'simulado-scope-public-exam',
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className={FIELD_LABEL}>{t('simulado.create.scopeLabel')}</span>
      <div className="grid gap-3.5 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = option.scope === value;

          return (
            <button
              key={option.scope}
              aria-pressed={isSelected}
              className={`grid grid-cols-[34px_minmax(0,1fr)] items-center gap-3 rounded-lg p-4 text-left transition-colors duration-200 ${
                isSelected ? 'border border-primary bg-primary/[0.07]' : 'border border-transparent bg-background'
              }`}
              data-testid={option.testId}
              type="button"
              onClick={() => onChange(option.scope)}
            >
              <span
                className={`flex h-[34px] w-[34px] items-center justify-center rounded-lg ${
                  isSelected ? 'bg-primary/20 text-primary' : 'bg-content2 text-default-400'
                }`}
              >
                <FontAwesomeIcon icon={option.icon} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {option.title}
                </span>
                <span className="truncate text-xs text-default-500">{option.body}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
