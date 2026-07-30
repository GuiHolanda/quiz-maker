'use client';
import { Input } from '@heroui/input';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface DraftExamMetricsFieldsProps {
  readonly isSaving: boolean;
  readonly totalQuestions: number | null | undefined;
  readonly examDurationMinutes: number | null | undefined;
  readonly passingScore: number | null | undefined;
  readonly onTotalQuestionsChange: (value: number | undefined) => void;
  readonly onExamDurationChange: (value: number | undefined) => void;
  readonly onPassingScoreChange: (value: number | undefined) => void;
}

export function DraftExamMetricsFields({
  isSaving,
  totalQuestions,
  examDurationMinutes,
  passingScore,
  onTotalQuestionsChange,
  onExamDurationChange,
  onPassingScoreChange,
}: DraftExamMetricsFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-4">
      <Input
        isRequired
        {...inputProperties.input}
        isDisabled={isSaving}
        label={t('exam.totalQuestions')}
        min={1}
        placeholder="e.g. 65"
        size="sm"
        type="number"
        value={totalQuestions ? String(totalQuestions) : ''}
        onValueChange={(v) => onTotalQuestionsChange(parseInt(v, 10) || undefined)}
      />
      <Input
        {...inputProperties.input}
        endContent={<span className="text-xs text-default-400 self-center">{t('exam.examDurationUnit')}</span>}
        isDisabled={isSaving}
        label={t('exam.examDuration')}
        min={1}
        placeholder="e.g. 130"
        size="sm"
        type="number"
        value={examDurationMinutes != null ? String(examDurationMinutes) : ''}
        onValueChange={(v) => onExamDurationChange(parseInt(v, 10) || undefined)}
      />
      <Input
        {...inputProperties.input}
        endContent={<span className="text-xs text-default-400 self-center">%</span>}
        isDisabled={isSaving}
        label={t('exam.passingScore')}
        max={100}
        min={0}
        placeholder="e.g. 72"
        size="sm"
        type="number"
        value={passingScore != null ? String(passingScore) : ''}
        onValueChange={(v) => onPassingScoreChange(parseFloat(v) || undefined)}
      />
    </div>
  );
}
