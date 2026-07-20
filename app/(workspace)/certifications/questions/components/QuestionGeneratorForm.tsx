'use client';
import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Form } from '@heroui/form';

import { QuizFormErrors, QuestionParams } from '@/shared/types';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { CertificationManager } from '@/shared/components/CertificationManager';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { inputProperties } from '@/config/constants/inputStyles';

interface QuestionGeneratorFormProps {
  readonly onGenerationStart: (params: QuestionParams) => void;
}

export function QuestionGeneratorForm({ onGenerationStart }: Readonly<QuestionGeneratorFormProps>) {
  const { selectedCertification, selectedTopics } = useCertificationsContext();
  const [error, setError] = useState<QuizFormErrors>({});
  const { t } = useTranslation();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const num_questions = formData.get('num_questions')?.toString().trim() ?? '5';
    const selectedTopic = selectedTopics[0];

    const newErrors: QuizFormErrors = {};

    if (!selectedCertification) newErrors.certificationTitle = t('error.certificationTitleRequired');
    if (!selectedTopic) newErrors.topic = t('error.topicRequired');
    if (!num_questions) newErrors.num_questions = t('error.numQuestionsRequired');
    if (Object.keys(newErrors).length > 0) {
      queueMicrotask(() => setError(newErrors));

      return;
    }

    const requestPayload: QuestionParams = {
      certification_name: selectedCertification?.label || '',
      topic_name: selectedTopic,
      num_questions: num_questions,
    };

    onGenerationStart(requestPayload);
  };

  return (
    <Form validationErrors={error} onSubmit={handleSubmit}>
      <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6 w-full">
        <CertificationManager className="flex w-full gap-4 items-end" />
        <div className="flex w-full items-end gap-4">
          <div className="no-number-spinners w-1/4">
            <Input
              id="num_questions"
              label={t('common.numberOfQuestions')}
              max={20}
              min={1}
              name="num_questions"
              placeholder={t('generate.numQuestionsPlaceholder')}
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

