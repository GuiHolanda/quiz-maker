'use client';
import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Form } from '@heroui/form';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { inputProperties } from '@/config/constants/inputStyles';

interface QuestionGeneratorFormProps {
  readonly managerSlot: React.ReactNode;
  readonly onGenerationStart: (numQuestions: string) => void;
  readonly numQuestionsError?: string;
  readonly numQuestionsPlaceholderKey?: string;
}

export function QuestionGeneratorForm({
  managerSlot,
  onGenerationStart,
  numQuestionsError,
  numQuestionsPlaceholderKey,
}: Readonly<QuestionGeneratorFormProps>) {
  const [error, setError] = useState<{ num_questions?: string }>({});
  const { t } = useTranslation();

  const formErrors = {
    ...error,
    ...(numQuestionsError ? { num_questions: numQuestionsError } : {}),
  } as Record<string, string>;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const num_questions = formData.get('num_questions')?.toString().trim() ?? '';

    const newErrors: { num_questions?: string } = {};
    if (!num_questions) newErrors.num_questions = t('error.numQuestionsRequired');
    if (Object.keys(newErrors).length > 0) {
      queueMicrotask(() => setError(newErrors));
      return;
    }

    onGenerationStart(num_questions);
  };

  return (
    <Form validationErrors={formErrors} onSubmit={handleSubmit}>
      <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6 w-full">
        {managerSlot}
        <div className="flex w-full items-end gap-4">
          <div className="no-number-spinners w-1/4">
            <Input
              id="num_questions"
              label={t('common.numberOfQuestions')}
              max={20}
              min={1}
              name="num_questions"
              placeholder={t(numQuestionsPlaceholderKey ?? 'generate.numQuestionsPlaceholder')}
              type="number"
              {...inputProperties.input}
            />
          </div>
          <Button
            className={`${buttonStyles.primary} ml-auto`}
            type="submit"
          >
            {t('common.generate')}
          </Button>
        </div>
      </div>
    </Form>
  );
}
