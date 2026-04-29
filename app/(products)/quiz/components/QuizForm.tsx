'use client';
import { getQuizQuestions } from '@/features/connectors';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { QuizFormErrors, StoredQuestion } from '@/types';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { CertificationManager } from '@/sharedComponents/CertificationManager';
import { SectionsTable } from '@/sharedComponents/SectionsTable';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { FormAccordion } from '@/sharedComponents/ui/FormAccordion';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface QuizFormProps {
  onGenerated: (questions: StoredQuestion[]) => void;
}

export function QuizForm({ onGenerated }: Readonly<QuizFormProps>) {
  const { t } = useTranslation();
  const { selectedCertification } = useCertificationsContext();
  const { loading, error, setError, request } = useRequest(getQuizQuestions);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const num_questions = formData.get('num_questions')?.toString().trim() ?? '';

    const newErrors: QuizFormErrors = {};
    if (!selectedCertification) newErrors.certificationTitle = t('error.certificationRequired');
    if (!num_questions) newErrors.num_questions = t('error.numQuestionsRequired');
    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    const questions = await request({
      certificationTitle: selectedCertification!.label,
      numQuestions: Number(num_questions),
    });

    if (questions) onGenerated(questions);
  };

  return (
    <FormAccordion
      title={t('quiz.configureQuiz')}
      accordionKey="quizForm"
      onSubmit={handleSubmit}
      validationErrors={error}
      isLoading={loading}
      footer={
        <div className="flex w-full justify-end pt-4">
          <Button
            type="submit"
            isLoading={loading}
            className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
          >
            {t('quiz.generateQuiz')}
          </Button>
        </div>
      }
    >
      <div className="flex gap-4 items-end">
        <CertificationManager isMultiple noTopics className="flex w-3/4 gap-4 items-end" />
        <div className="no-number-spinners w-1/4">
          <Input
            type="number"
            name="num_questions"
            label={t('common.numberOfQuestions')}
            placeholder={t('quiz.placeholder')}
            min={1}
            {...inputProperties.input}
          />
        </div>
      </div>
      <SectionsTable selectedCertification={selectedCertification} />
    </FormAccordion>
  );
}
