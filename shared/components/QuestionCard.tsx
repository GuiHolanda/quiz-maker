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
  readonly onPendingChange?: (questionId: number, hasPending: boolean) => void;
}

export function QuestionCard({ question, onAnswerChange, initialValue, index, onPendingChange }: QuestionCardProps) {
  const { t } = useTranslation();
  const [currentSelection, setCurrentSelection] = useState<string[]>(initialValue ?? []);
  const onPendingChangeRef = useRef(onPendingChange);
  onPendingChangeRef.current = onPendingChange;

  const isSaved = initialValue !== undefined && initialValue.length > 0;
  const hasChanged =
    isSaved &&
    (currentSelection.length !== initialValue.length ||
      currentSelection.some((v, i) => v !== initialValue[i]));

  useEffect(() => {
    setCurrentSelection(initialValue ?? []);
  }, [question.id, question.correctCount, initialValue]);

  useEffect(() => {
    onPendingChangeRef.current?.(question.id, hasChanged);
  }, [hasChanged, question.id]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentSelection.length) return;
    onAnswerChange(question.id, currentSelection);
  };

  const onCheckboxChange = (value: string | string[]) => {
    const next = Array.isArray(value) ? value : [value];
    if (question.correctCount && next.length > question.correctCount) return;
    setCurrentSelection(next);
  };

  const renderCheckboxes = () =>
    Object.entries(question.options).map(([key, val]) => {
      const isChecked = currentSelection.includes(key);
      const disableIfLimitReached =
        !!question.correctCount && currentSelection.length >= question.correctCount && !isChecked;
      return (
        <Checkbox
          key={key}
          value={key}
          size="sm"
          disabled={disableIfLimitReached}
          classNames={{ label: 'text-sm font-light text-default-600' }}
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
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-warning text-sm" />
          {t('simulado.answerChanged')}
        </div>
      )}
      <div className="p-5">
        <div className="pb-3 mb-3 border-b border-divider">
          <h4 className="font-semibold text-foreground text-sm leading-relaxed">
            <span className="inline-block mr-2 text-default-400">
              {String(index ?? question.id).padStart(2, '0')}.
            </span>
            {question.text}
          </h4>
        </div>
        <Form onSubmit={handleSubmit} className="flex flex-row items-end">
          {question.correctCount && question.correctCount > 1 ? (
            <CheckboxGroup
              label={t('quiz.correctAnswers', { count: question.correctCount })}
              value={currentSelection}
              onValueChange={onCheckboxChange}
              className="w-4/5"
              classNames={{ label: 'text-xs text-default-400 font-semibold mb-1' }}
            >
              {renderCheckboxes()}
            </CheckboxGroup>
          ) : (
            <RadioGroup
              value={currentSelection[0] ?? ''}
              onValueChange={(value) => setCurrentSelection(value ? [value] : [])}
              className="w-4/5"
            >
              {Object.entries(question.options).map(([key, val]) => (
                <Radio key={key} value={key} size="sm" classNames={{ label: 'text-sm ml-2 text-default-600' }}>
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
                  <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5 text-xs" />
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
