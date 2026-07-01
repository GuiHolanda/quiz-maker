'use client';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Form } from '@heroui/form';

import { getQuestions } from '@/features/connectors';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { QuizFormErrors, AIQuestion, QuestionParams } from '@/shared/types';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { CertificationManager } from '@/shared/components/CertificationManager';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface QuestionareFormProps {
  readonly onGenerated: (questions: AIQuestion[]) => void;
  readonly onGenerationStart?: (numQuestions: number) => void;
}

export function QuestionGeneratorForm({ onGenerated, onGenerationStart }: Readonly<QuestionareFormProps>) {
  const { selectedCertification, selectedTopics } = useCertificationsContext();
  const { loading, error, setError, request } = useRequest(getQuestions);
  const { t } = useTranslation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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

    onGenerationStart?.(parseInt(num_questions, 10) || 5);

    const questions = await request(requestPayload);

    if (questions) {
      onGenerated(questions);
    }
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
            className="ml-auto bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
            disabled={loading}
            type="submit"
          >
            {t('common.generate')}
          </Button>
        </div>
      </div>
    </Form>
  );
}

