'use client';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { ExamType } from '@/shared/types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faLandmark } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface GenerationScopePickerProps {
  readonly value: ExamType;
  readonly isDisabled?: boolean;
  readonly onChange: (value: ExamType) => void;
}

const FIELD_LABEL = 'text-xs font-semibold text-default-400';

export function GenerationScopePicker({ value, isDisabled = false, onChange }: GenerationScopePickerProps) {
  const { t } = useTranslation();

  const options: { scope: ExamType; icon: IconDefinition; title: string; body: string }[] = [
    {
      scope: 'certification',
      icon: faGraduationCap,
      title: t('generate.typeCertification'),
      body: t('generate.chooseTypeCertification'),
    },
    {
      scope: 'public_exam',
      icon: faLandmark,
      title: t('generate.typePublicExam'),
      body: t('generate.chooseTypePublicExam'),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <span className={FIELD_LABEL}>{t('generate.scopeSectionLabel')}</span>
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = option.scope === value;

          return (
            <button
              key={option.scope}
              aria-pressed={isSelected}
              className={`grid grid-cols-[36px_minmax(0,1fr)] items-start gap-3.5 rounded-xl border p-[18px] text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected ? 'border-primary bg-primary/[0.07]' : 'border-content2 bg-content1 hover:border-primary/40'
              }`}
              data-testid={`type-option-${option.scope}`}
              disabled={isDisabled}
              type="button"
              onClick={() => onChange(option.scope)}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-[9px] ${
                  isSelected ? 'bg-primary/[0.14] text-primary' : 'bg-content2 text-default-500'
                }`}
              >
                <FontAwesomeIcon className="h-[18px] w-[18px]" icon={option.icon} />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span
                  className={`text-base font-bold tracking-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}
                >
                  {option.title}
                </span>
                <span className="text-[13.5px] leading-snug text-default-500">{option.body}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
