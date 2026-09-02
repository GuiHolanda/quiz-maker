'use client';

import type { MockExamQuestionSource } from '@/shared/types';

import { FieldLabel } from '@/shared/components/ui/FieldLabel';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface SourcePickerProps {
  readonly value: MockExamQuestionSource;
  readonly onChange: (value: MockExamQuestionSource) => void;
  readonly counts: { library: number; unseen: number; wrong: number } | null;
}

export function SourcePicker({ value, onChange, counts }: SourcePickerProps) {
  const { t } = useTranslation();

  const options: { key: MockExamQuestionSource; title: string; body: string; testId: string }[] = [
    {
      key: 'library',
      title: t('simulado.create.sourceLibraryTitle'),
      body: t('simulado.create.sourceLibraryBody'),
      testId: 'simulado-source-library',
    },
    {
      key: 'unseen',
      title: t('simulado.create.sourceUnseenTitle'),
      body: t('simulado.create.sourceUnseenBody'),
      testId: 'simulado-source-unseen',
    },
    {
      key: 'wrong',
      title: t('simulado.create.sourceWrongTitle'),
      body: t('simulado.create.sourceWrongBody'),
      testId: 'simulado-source-wrong',
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{t('simulado.create.sourceLabel')}</FieldLabel>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => {
          const isSelected = option.key === value;
          const meta = counts == null ? '—' : t('simulado.create.sourceAvailable', { count: counts[option.key] });

          return (
            <button
              key={option.key}
              aria-pressed={isSelected}
              className={`flex flex-col gap-1.5 rounded-lg p-3.5 text-left transition-colors duration-200 ${
                isSelected ? 'border border-primary bg-primary/[0.07]' : 'border border-transparent bg-background'
              }`}
              data-testid={option.testId}
              type="button"
              onClick={() => onChange(option.key)}
            >
              <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                {option.title}
              </span>
              <span className="text-xs leading-snug text-default-500">{option.body}</span>
              <span className={`font-mono text-[11.5px] ${isSelected ? 'text-primary' : 'text-default-400'}`}>
                {meta}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
