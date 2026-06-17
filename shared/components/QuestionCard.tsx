'use client';

import { FormEvent, useState, useEffect, useRef } from 'react';
import { Button } from '@heroui/button';
import { CheckboxGroup, Checkbox } from '@heroui/checkbox';
import { RadioGroup, Radio } from '@heroui/radio';
import { Form } from '@heroui/form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { StoredQuestion, StoredPublicExamQuestion } from '@/shared/types';

export type QuestionCardQuestion = Pick<
  StoredQuestion | StoredPublicExamQuestion,
  'id' | 'text' | 'correctCount' | 'options'
>;

interface QuestionCardProps {
  readonly question: QuestionCardQuestion;
  readonly onAnswerChange: (questionId: number, value: string | string[]) => void;
  readonly initialValue?: string[];
  readonly index?: number;
  readonly draftValue?: string[];
  readonly onSelectionChange?: (questionId: number, selection: string[]) => void;
}

export function QuestionCard({
  question,
  onAnswerChange,
  initialValue,
  index,
  draftValue,
  onSelectionChange,
}: QuestionCardProps) {
  const { t } = useTranslation();

  // Keep draftValue in a ref so the reset effect can read latest without being a dependency
  const draftValueRef = useRef(draftValue);

  draftValueRef.current = draftValue;

  const [currentSelection, setCurrentSelection] = useState<string[]>(draftValue ?? initialValue ?? []);

  const isSaved = initialValue !== undefined && initialValue.length > 0;
  const hasChanged =
    isSaved &&
    (currentSelection.length !== initialValue.length || currentSelection.some((v, i) => v !== initialValue[i]));

  // On question change or after a save (initialValue changes), restore from draft or saved answer
  useEffect(() => {
    setCurrentSelection(draftValueRef.current ?? initialValue ?? []);
  }, [question.id, question.correctCount, initialValue]);

  const applySelection = (next: string[]) => {
    setCurrentSelection(next);
    onSelectionChange?.(question.id, next);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentSelection.length) return;
    onAnswerChange(question.id, currentSelection);
  };

  const onCheckboxChange = (value: string | string[]) => {
    const next = Array.isArray(value) ? value : [value];

    if (question.correctCount && next.length > question.correctCount) return;
    applySelection(next);
  };

  const renderCheckboxes = () =>
    Object.entries(question.options).map(([key, val]) => {
      const isChecked = currentSelection.includes(key);
      const disableIfLimitReached =
        !!question.correctCount && currentSelection.length >= question.correctCount && !isChecked;

      return (
        <Checkbox
          key={key}
          classNames={{ label: 'text-sm font-light text-default-600' }}
          disabled={disableIfLimitReached}
          size="sm"
          value={key}
        >
          {String(val)}
        </Checkbox>
      );
    });

  const minSelectionCount = question.correctCount && question.correctCount > 0 ? question.correctCount : 1;
  const canSubmit = currentSelection.length >= minSelectionCount;
  const borderClass = hasChanged ? 'border-warning' : 'border-default-200';

  return (
    <div className={`bg-content1 border rounded-xl overflow-hidden ${borderClass}`}>
      {hasChanged && (
        <div className="flex items-center gap-2 px-5 py-2 bg-warning-50 border-b border-warning text-warning-700 text-xs font-medium">
          <FontAwesomeIcon className="text-warning text-sm" icon={faTriangleExclamation} />
          {t('simulado.answerChanged')}
        </div>
      )}
      <div className="p-5">
        <div className="pb-3 mb-3 border-b border-divider">
          <h4 className="font-semibold text-foreground text-sm leading-relaxed">
            <span className="inline-block mr-2 text-default-400">{String(index ?? question.id).padStart(2, '0')}.</span>
            {question.text}
          </h4>
        </div>
        <Form className="flex flex-row items-end" onSubmit={handleSubmit}>
          {question.correctCount && question.correctCount > 1 ? (
            <CheckboxGroup
              className="w-4/5"
              classNames={{ label: 'text-xs text-default-400 font-semibold mb-1' }}
              label={t('quiz.correctAnswers', { count: question.correctCount })}
              value={currentSelection}
              onValueChange={onCheckboxChange}
            >
              {renderCheckboxes()}
            </CheckboxGroup>
          ) : (
            <RadioGroup
              className="w-4/5"
              value={currentSelection[0] ?? ''}
              onValueChange={(value) => applySelection(value ? [value] : [])}
            >
              {Object.entries(question.options).map(([key, val]) => (
                <Radio key={key} classNames={{ label: 'text-sm ml-2 text-default-600' }} size="sm" value={key}>
                  {String(val)}
                </Radio>
              ))}
            </RadioGroup>
          )}
          {canSubmit && (
            <Button
              className={`ml-auto text-xs font-semibold rounded-lg transition-all duration-200 py-0 h-8 px-4 ${
                hasChanged
                  ? 'bg-warning text-warning-foreground hover:opacity-90'
                  : isSaved
                    ? 'bg-success text-success-foreground hover:opacity-90'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
              type="submit"
            >
              {hasChanged ? (
                <>{t('simulado.answerPending')}</>
              ) : isSaved ? (
                <>
                  <FontAwesomeIcon className="mr-1.5 text-xs" icon={faCircleCheck} />
                  {t('simulado.answerSaved')}
                </>
              ) : (
                t('common.submit')
              )}
            </Button>
          )}
          {!canSubmit && <input type="hidden" />}
        </Form>
      </div>
    </div>
  );
}
