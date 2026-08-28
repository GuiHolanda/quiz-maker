'use client';

import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface ExamOption {
  readonly id: string;
  readonly label: string;
}

interface ExamAndCountRowProps {
  readonly examLabel: string;
  readonly exams: ExamOption[];
  readonly examId: string | null;
  readonly onExam: (id: string) => void;
  readonly totalQuestions: number;
  readonly onTotal: (value: number) => void;
}

const FIELD_LABEL = 'text-xs font-semibold text-default-400';

const monoInputClassNames = {
  ...inputProperties.input.classNames,
  input: `${inputProperties.input.classNames.input} text-center font-mono`,
};

export function ExamAndCountRow({ examLabel, exams, examId, onExam, totalQuestions, onTotal }: ExamAndCountRowProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-end">
      <div className="flex flex-col gap-2">
        <span className={FIELD_LABEL}>{examLabel}</span>
        <Select
          {...inputProperties.select}
          aria-label={examLabel}
          data-testid="simulado-exam-select"
          disallowEmptySelection
          placeholder=" "
          isDisabled={exams.length === 0}
          selectedKeys={examId ? new Set([examId]) : new Set()}
          onSelectionChange={(keys) => {
            const next = String(Array.from(keys)[0] ?? '');

            if (next) onExam(next);
          }}
        >
          {exams.map((option) => (
            <SelectItem key={option.id}>{option.label}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <span className={FIELD_LABEL}>{t('simulado.create.questionsLabel')}</span>
        <Input
          {...inputProperties.input}
          aria-label={t('simulado.create.questionsLabel')}
          classNames={monoInputClassNames}
          data-testid="simulado-total-input"
          min={1}
          placeholder=" "
          type="number"
          value={totalQuestions > 0 ? String(totalQuestions) : ''}
          onValueChange={(value) => onTotal(Number(value) || 0)}
        />
      </div>
    </div>
  );
}
