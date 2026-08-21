'use client';
import type { Exam } from '@/shared/types';
import type { QuestionFormatKey } from '@/config/question-formats';
import type { FieldDensity } from '@/shared/components/exam-editor/ExamIdentityFields';

import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties, compactInputClassNames, compactSelectClassNames } from '@/config/constants/inputStyles';
import { DEFAULT_QUESTION_FORMAT } from '@/config/question-formats';

export const QUESTION_FORMAT_OPTIONS: ReadonlyArray<{ key: QuestionFormatKey; labelKey: string }> = [
  { key: 'mc_5', labelKey: 'exam.questionFormatMc5' },
  { key: 'mc_4', labelKey: 'exam.questionFormatMc4' },
  { key: 'true_false', labelKey: 'exam.questionFormatTrueFalse' },
];

interface ExamFormatFieldsProps {
  readonly draft: Exam;
  readonly isSaving: boolean;
  readonly density?: FieldDensity;
  readonly onUpdateNumericField: (
    field: 'totalQuestions' | 'examDurationMinutes' | 'passingScore',
    value: number | undefined
  ) => void;
  readonly onUpdateQuestionFormat: (format: QuestionFormatKey) => void;
}

export function ExamFormatFields({
  draft,
  isSaving,
  density = 'compact',
  onUpdateNumericField,
  onUpdateQuestionFormat,
}: ExamFormatFieldsProps) {
  const { t } = useTranslation();
  const isCertification = draft.type === 'certification';
  const isCompact = density === 'compact';
  const questionFormat = draft.questionFormat ?? DEFAULT_QUESTION_FORMAT;
  const inputClassNames = isCompact ? compactInputClassNames : inputProperties.input.classNames;
  const selectClassNames = isCompact ? compactSelectClassNames : inputProperties.select.classNames;

  return (
    <>
      <div className={isCompact ? 'flex gap-4 items-start' : 'flex flex-wrap gap-4 items-start'}>
        <div className={isCompact ? 'flex-1 min-w-0' : 'w-[206px]'}>
          <Input
            isRequired
            {...inputProperties.input}
            classNames={inputClassNames}
            isDisabled={isSaving}
            label={t('exam.totalQuestions')}
            min={1}
            placeholder={t('exam.totalQuestionsPlaceholder')}
            size="sm"
            type="number"
            value={draft.totalQuestions ? String(draft.totalQuestions) : ''}
            onValueChange={(v) => onUpdateNumericField('totalQuestions', parseInt(v, 10) || undefined)}
          />
          {!isCompact && <p className="text-[10px] font-semibold text-default-400">{t('exam.totalQuestionsHint')}</p>}
        </div>
        <div className={isCompact ? 'flex-1 min-w-0' : 'w-[195px]'}>
          <Input
            {...inputProperties.input}
            classNames={inputClassNames}
            endContent={<span className="text-xs text-default-400 self-center">{t('exam.examDurationUnit')}</span>}
            isDisabled={isSaving}
            label={t('exam.examDuration')}
            min={1}
            placeholder={t('exam.examDurationPlaceholder')}
            size="sm"
            type="number"
            value={draft.examDurationMinutes != null ? String(draft.examDurationMinutes) : ''}
            onValueChange={(v) => onUpdateNumericField('examDurationMinutes', parseInt(v, 10) || undefined)}
          />
        </div>
        <div className={isCompact ? 'flex-1 min-w-0 flex flex-col gap-1' : 'w-[154px] flex flex-col gap-1'}>
          <Input
            {...inputProperties.input}
            classNames={inputClassNames}
            endContent={<span className="text-xs text-default-400 self-center">%</span>}
            isDisabled={isSaving}
            label={t('exam.passingScore')}
            max={100}
            min={0}
            placeholder={t('exam.passingScorePlaceholder')}
            size="sm"
            type="number"
            value={draft.passingScore != null ? String(draft.passingScore) : ''}
            onValueChange={(v) => onUpdateNumericField('passingScore', parseFloat(v) || undefined)}
          />
          {isCertification && (
            <p className="text-[10px] font-semibold text-default-400">{t('exam.passingScoreHint')}</p>
          )}
        </div>
        <div className={isCompact ? 'flex-1 min-w-0 flex flex-col gap-1' : 'flex-1 min-w-[280px] flex flex-col gap-1'}>
          <Select
            {...inputProperties.select}
            classNames={selectClassNames}
            disallowEmptySelection
            isDisabled={isSaving}
            label={t('exam.questionFormat')}
            placeholder={t('exam.questionFormat')}
            selectedKeys={[questionFormat]}
            size="sm"
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];

              if (selected) onUpdateQuestionFormat(selected as QuestionFormatKey);
            }}
          >
            {QUESTION_FORMAT_OPTIONS.map((option) => (
              <SelectItem key={option.key} textValue={t(option.labelKey)}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </Select>
          {/* Sibling <p>, not `description` — see the Select+description gotcha in app/CLAUDE.md. */}
          <p className="text-[10px] font-semibold text-default-400">{t('exam.questionFormatHint')}</p>
        </div>
      </div>
    </>
  );
}
