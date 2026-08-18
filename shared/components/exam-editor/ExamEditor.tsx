'use client';
import type { Exam, ExamBoard, ExamSection, Provider } from '@/shared/types';
import type { QuestionFormatKey } from '@/config/question-formats';

import { useEffect, useState } from 'react';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';

import { ExamDistributionTable } from '@/shared/components/ai-chat/ExamDistributionTable';
import { getExamDraftValidation } from '@/lib/exam-draft-validation';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getProviders, getExamBoards } from '@/features/connectors';
import { inputProperties, inputLabelClass } from '@/config/constants/inputStyles';
import { DEFAULT_QUESTION_FORMAT } from '@/config/question-formats';

export const QUESTION_FORMAT_OPTIONS: ReadonlyArray<{ key: QuestionFormatKey; labelKey: string }> = [
  { key: 'mc_5', labelKey: 'exam.questionFormatMc5' },
  { key: 'mc_4', labelKey: 'exam.questionFormatMc4' },
  { key: 'true_false', labelKey: 'exam.questionFormatTrueFalse' },
];

// `font-semibold` alone would apply to placeholder text too, making an empty field read as
// already filled in — placeholder: overrides keep it visibly lighter than real input.
const COMPACT_INPUT_CLASSNAMES = {
  inputWrapper: 'h-8 bg-background rounded-lg',
  input: 'text-xs font-semibold placeholder:font-normal placeholder:text-default-300',
};

interface ExamEditorProps {
  readonly draft: Exam;
  readonly isSaving: boolean;
  readonly onUpdateField: (
    field: keyof Pick<Exam, 'name' | 'role' | 'year' | 'key'>,
    value: string | number | null
  ) => void;
  readonly onUpdateNumericField: (
    field: 'totalQuestions' | 'examDurationMinutes' | 'passingScore',
    value: number | undefined
  ) => void;
  readonly onUpdateReferenceName: (name: string) => void;
  readonly onUpdateQuestionFormat: (format: QuestionFormatKey) => void;
  readonly onUpdateSection: (index: number, patch: Partial<ExamSection>) => void;
  readonly onRemoveSection: (index: number) => void;
  readonly onAddTopic: (sectionIndex: number, name: string) => void;
  readonly onRemoveTopic: (sectionIndex: number, topicIndex: number) => void;
  readonly onUpdateTopic: (sectionIndex: number, topicIndex: number, newName: string) => void;
}

// Container-agnostic exam draft editor: the field layout + distribution table shared by
// every place a user configures an Exam — the AI-chat draft modal (ExamModal), and
// /exams/new + /exams/[id]/edit (see plan §2). Callers own the draft state via
// useExamDraftCard and whatever chrome (modal vs. page) wraps this — this component
// only renders form content, never a Modal/PageHeader/action bar itself.
export function ExamEditor({
  draft,
  isSaving,
  onUpdateField,
  onUpdateNumericField,
  onUpdateReferenceName,
  onUpdateQuestionFormat,
  onUpdateSection,
  onRemoveSection,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
}: ExamEditorProps) {
  const { t } = useTranslation();
  const [referenceEntities, setReferenceEntities] = useState<Provider[] | ExamBoard[]>([]);

  const isCertification = draft.type === 'certification';
  const referenceName = isCertification ? (draft.provider?.name ?? '') : (draft.examBoard?.name ?? '');
  const referenceLabel = isCertification ? t('exam.provider') : t('exam.examBoard');
  const questionFormat = draft.questionFormat ?? DEFAULT_QUESTION_FORMAT;
  const { isDistributionValid, distributionSum } = getExamDraftValidation(draft);

  useEffect(() => {
    const fetcher = isCertification ? getProviders : getExamBoards;

    fetcher()
      .then((items) => setReferenceEntities(items as Provider[] | ExamBoard[]))
      .catch(() => {});
  }, [isCertification]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4">
        <Input
          {...inputProperties.input}
          classNames={COMPACT_INPUT_CLASSNAMES}
          data-testid="exam-editor-name-input"
          isDisabled={isSaving}
          label={t('exam.name')}
          placeholder=" "
          value={draft.name}
          onValueChange={(v) => onUpdateField('name', v)}
          size="sm"
          className="grow"
        />
        <Input
          {...inputProperties.input}
          classNames={COMPACT_INPUT_CLASSNAMES}
          isDisabled={isSaving}
          label={isCertification ? t('exam.keyLabel') : t('exam.editalKeyLabel')}
          placeholder={isCertification ? t('exam.certKeyPlaceholder') : t('exam.editalKeyPlaceholder')}
          value={draft.key ?? ''}
          onValueChange={(v) => onUpdateField('key', v || null)}
          size="sm"
          className="w-1/5"
        />
      </div>

      <div className="flex gap-4">
        {!isCertification && (
          <Input
            {...inputProperties.input}
            classNames={COMPACT_INPUT_CLASSNAMES}
            isDisabled={isSaving}
            label={t('exam.role')}
            placeholder=" "
            value={draft.role ?? ''}
            onValueChange={(v) => onUpdateField('role', v || null)}
            size="sm"
          />
        )}
        <Autocomplete
          allowsCustomValue
          {...inputProperties.autocomplete}
          inputProps={{ classNames: COMPACT_INPUT_CLASSNAMES }}
          inputValue={referenceName}
          isDisabled={isSaving}
          label={referenceLabel}
          placeholder={isCertification ? t('certification.providerPlaceholder') : t('concurso.bancaPlaceholder')}
          size="sm"
          className="w-2/5"
          onInputChange={onUpdateReferenceName}
        >
          {referenceEntities.map((entity) => (
            <AutocompleteItem key={entity.name}>{entity.name}</AutocompleteItem>
          ))}
        </Autocomplete>
        <Input
          {...inputProperties.input}
          classNames={COMPACT_INPUT_CLASSNAMES}
          isDisabled={isSaving}
          label={t('exam.year')}
          placeholder=" "
          type="number"
          value={draft.year?.toString() ?? ''}
          onValueChange={(v) => onUpdateField('year', v ? parseInt(v, 10) : null)}
          size="sm"
          className="w-1/5"
        />
      </div>

      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <Input
            isRequired
            {...inputProperties.input}
            classNames={COMPACT_INPUT_CLASSNAMES}
            isDisabled={isSaving}
            label={t('exam.totalQuestions')}
            min={1}
            placeholder={t('exam.totalQuestionsPlaceholder')}
            size="sm"
            type="number"
            value={draft.totalQuestions ? String(draft.totalQuestions) : ''}
            onValueChange={(v) => onUpdateNumericField('totalQuestions', parseInt(v, 10) || undefined)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <Input
            {...inputProperties.input}
            classNames={COMPACT_INPUT_CLASSNAMES}
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
        <div className="flex-1 min-w-0">
          <Input
            {...inputProperties.input}
            classNames={COMPACT_INPUT_CLASSNAMES}
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
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <Select
            {...inputProperties.select}
            classNames={{
              label: inputLabelClass,
              trigger: 'h-8 bg-background rounded-lg',
              value: 'text-xs font-semibold',
            }}
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
          {/* Sibling <p>, not `description`: on a Select with labelPlacement="outside" the
              helper cancels the label's lift transform (see app/CLAUDE.md). */}
          <p className="text-xs text-default-500">{t('exam.questionFormatHint')}</p>
        </div>
      </div>

      <ExamDistributionTable
        isSaving={isSaving}
        sections={draft.sections}
        onAddTopic={onAddTopic}
        onRemoveSection={onRemoveSection}
        onRemoveTopic={onRemoveTopic}
        onUpdateSection={onUpdateSection}
        onUpdateTopic={onUpdateTopic}
      />

      {draft.sections.length > 0 && (
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${distributionSum === 100 ? 'text-success' : 'text-warning'}`}>
            {t('exam.distributionTotal', { sum: distributionSum })}
          </span>
          {distributionSum !== 100 && (
            <span className="text-xs text-default-400">{t('exam.distributionTotalHint')}</span>
          )}
          {!isDistributionValid && <span className="text-xs text-danger">{t('exam.distributionInvalidHint')}</span>}
        </div>
      )}
    </div>
  );
}
