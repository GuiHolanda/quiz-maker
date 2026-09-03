'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faLandmark } from '@fortawesome/free-solid-svg-icons';

import { FieldLabel } from '@/shared/components/ui/FieldLabel';
import type { ExamType } from '@/shared/types';

interface ExamTypeOption {
  readonly title: string;
  readonly body: string;
  readonly testId?: string;
}

interface ExamTypePickerProps {
  readonly value: ExamType;
  readonly onChange: (value: ExamType) => void;
  readonly label: string;
  readonly certification: ExamTypeOption;
  readonly publicExam: ExamTypeOption;
  readonly isDisabled?: boolean;
}

export function ExamTypePicker({
  value,
  onChange,
  label,
  certification,
  publicExam,
  isDisabled = false,
}: ExamTypePickerProps) {
  const options: (ExamTypeOption & { scope: ExamType; icon: typeof faGraduationCap })[] = [
    { ...certification, scope: 'certification', icon: faGraduationCap },
    { ...publicExam, scope: 'public_exam', icon: faLandmark },
  ];

  return (
    <div className="flex flex-col gap-3">
      <FieldLabel>{label}</FieldLabel>
      <div className="grid gap-3.5 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = option.scope === value;

          return (
            <button
              key={option.scope}
              aria-pressed={isSelected}
              className={`grid grid-cols-[36px_minmax(0,1fr)] items-start gap-3.5 rounded-xl border p-[18px] text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? 'border-primary bg-primary/[0.07]'
                  : 'border-transparent bg-background hover:border-primary/40'
              }`}
              data-testid={option.testId}
              disabled={isDisabled}
              type="button"
              onClick={() => onChange(option.scope)}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
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
