'use client';

import { useState } from 'react';
import { Button, CheckboxGroup, Checkbox, RadioGroup, Radio } from '@heroui/react';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface SimuladoQuestion {
  id: number;
  text: string;
  correctCount: number;
  subject: string;
  options: Record<string, string>;
}

interface SimuladoQuestionCardProps {
  readonly question: SimuladoQuestion;
  readonly selectedOptions: string[];
  readonly onAnswerChange: (selected: string[]) => void;
}

export function SimuladoQuestionCard({ question, selectedOptions, onAnswerChange }: SimuladoQuestionCardProps) {
  const { t } = useTranslation();
  const [localSelection, setLocalSelection] = useState<string[]>(selectedOptions);
  const isMultiple = question.correctCount > 1;
  const isSubmitted = selectedOptions.length > 0;

  function handleSubmit() {
    onAnswerChange(localSelection);
  }

  function handleCheckboxChange(values: string[]) {
    if (values.length <= question.correctCount) setLocalSelection(values);
  }

  return (
    <div className="border border-default-200 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-default-400 uppercase tracking-wide">{question.subject}</p>
        {isSubmitted && <span className="text-xs text-success">{t('simulado.correct')}</span>}
      </div>
      <p className="text-sm">{question.text}</p>

      {isMultiple ? (
        <CheckboxGroup value={localSelection} onChange={handleCheckboxChange}>
          {Object.entries(question.options).map(([label, text]) => (
            <Checkbox key={label} value={label}>
              {label}) {text}
            </Checkbox>
          ))}
        </CheckboxGroup>
      ) : (
        <RadioGroup value={localSelection[0] ?? ''} onChange={(v) => setLocalSelection([v])}>
          {Object.entries(question.options).map(([label, text]) => (
            <Radio key={label} value={label}>
              {label}) {text}
            </Radio>
          ))}
        </RadioGroup>
      )}

      {!isSubmitted && localSelection.length >= (isMultiple ? question.correctCount : 1) && (
        <Button color="primary" size="sm" onPress={handleSubmit}>
          {t('common.submit')}
        </Button>
      )}
    </div>
  );
}
