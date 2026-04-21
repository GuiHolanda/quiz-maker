import { FormEvent, useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { StoredQuestion } from '@/types';
import { CheckboxGroup, Checkbox } from '@heroui/checkbox';
import { RadioGroup, Radio } from '@heroui/radio';
import { Form } from '@heroui/form';

interface QuestionCardProps {
  readonly question: StoredQuestion;
  readonly onAnswerChange: (questionId: number, value: string | string[]) => void;
  readonly initialValue?: string[];
}

export function QuestionCard({ question, onAnswerChange, initialValue }: QuestionCardProps) {
  const [currentSelection, setCurrentSelection] = useState<string[]>([]);

  useEffect(() => {
    if (initialValue) {
      setCurrentSelection(initialValue);
    } else {
      setCurrentSelection([]);
    }
  }, [question.id, question.correctCount, initialValue]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const answer = currentSelection;
    if (!answer) return;
    onAnswerChange?.(question.id, answer);
  };

  const onCheckboxChange = (value: string | string[]) => {
    const next = Array.isArray(value) ? value : [value];
    if (question.correctCount && next.length > question.correctCount) return;
    setCurrentSelection(next);
  };

  const renderCheckboxes = () => {
    return Object.entries(question.options).map(([key, val]) => {
      const isChecked = currentSelection.includes(key);
      const disableIfLimitReached =
        !!question.correctCount && currentSelection.length >= question.correctCount && !isChecked;

      return (
        <Checkbox
          key={key}
          value={key}
          size="sm"
          disabled={disableIfLimitReached}
          classNames={{ label: 'text-sm font-light text-white/70' }}
        >
          {String(val)}
        </Checkbox>
      );
    });
  };

  const minSelectionCount = question.correctCount && question.correctCount > 0 ? question.correctCount : 1;

  return (
    <div className="clay-question-card p-5">
      <div className="pb-3 mb-3 border-b border-white/[0.06]">
        <h4 className="font-semibold text-white/80 text-sm leading-relaxed">
          <span className="inline-block mr-2 text-white/35">{String(question.id).padStart(2, '0')}.</span>
          {question.text}
        </h4>
      </div>
      <Form onSubmit={handleSubmit} className="flex flex-row items-end">
        {question.correctCount && question.correctCount > 1 ? (
          <CheckboxGroup
            label={`${question.correctCount} correct answers`}
            value={currentSelection}
            onValueChange={onCheckboxChange}
            className="w-4/5"
            classNames={{ label: 'text-xs text-white/30 font-semibold mb-1' }}
          >
            {renderCheckboxes()}
          </CheckboxGroup>
        ) : (
          <RadioGroup
            value={currentSelection[0] ?? ''}
            onValueChange={(value) => setCurrentSelection(value ? [value] : [])}
            className="w-4/5"
          >
            {Object.entries(question.options).map(([key, val]) => {
              return (
                <Radio key={key} value={key} size="sm" classNames={{ label: 'text-sm ml-2 text-white/70' }}>
                  {String(val)}
                </Radio>
              );
            })}
          </RadioGroup>
        )}
        {currentSelection.length >= minSelectionCount ? (
          <Button
            className="ml-auto bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-[0_3px_10px_rgba(139,92,246,0.35)] hover:shadow-[0_4px_14px_rgba(139,92,246,0.5)] transition-all duration-200 py-0 h-8 px-4"
            type="submit"
          >
            Submit
          </Button>
        ) : (
          <input type="hidden" />
        )}
      </Form>
    </div>
  );
}
