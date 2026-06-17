'use client';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';

import { getPublicExamQuestions } from '@/features/connectors';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { PublicExamFormErrors, AIPublicExamQuestion, PublicExamQuestionParams } from '@/shared/types';
import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { PublicExamManager } from '@/shared/components/PublicExamManager';
import { FormAccordion } from '@/shared/components/ui/FormAccordion';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface PublicExamQuestionGeneratorFormProps {
  onGenerated: (questions: AIPublicExamQuestion[]) => void;
}

export function PublicExamQuestionGeneratorForm({ onGenerated }: Readonly<PublicExamQuestionGeneratorFormProps>) {
  const { selectedPublicExam, selectedSubjects, selectedTopic } = usePublicExamsContext();
  const { loading, error, setError, request } = useRequest(getPublicExamQuestions);
  const { t } = useTranslation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const num_questions = formData.get('num_questions')?.toString().trim() ?? '5';
    const selectedSubject = selectedSubjects[0];

    const newErrors: PublicExamFormErrors = {};

    if (!selectedPublicExam) newErrors.publicExamName = t('error.publicExamRequired');
    if (!selectedSubject) newErrors.subject = t('error.subjectRequired');
    if (!num_questions) newErrors.num_questions = t('error.numQuestionsRequired');
    if (Object.keys(newErrors).length > 0) {
      queueMicrotask(() => setError(newErrors));

      return;
    }

    const requestPayload: PublicExamQuestionParams = {
      public_exam_name: selectedPublicExam?.name || '',
      exam_board_name: selectedPublicExam?.examBoard?.name || '',
      subject_name: selectedSubject,
      topic_name: selectedTopic || undefined,
      num_questions,
    };

    const questions = await request(requestPayload);

    if (questions) onGenerated(questions);
  };

  return (
    <FormAccordion
      accordionKey="configure-public-exam-generator"
      isLoading={loading}
      title={t('concurso.configureGenerator')}
      validationErrors={error as Record<string, string>}
      onSubmit={handleSubmit}
    >
      <PublicExamManager showTopic className="flex w-full gap-4 items-end" />
      <div className="flex w-full items-end gap-4">
        <div className="no-number-spinners w-1/4">
          <Input
            id="num_questions"
            label={t('common.numberOfQuestions')}
            max={20}
            min={1}
            name="num_questions"
            placeholder={t('concurso.numQuestionsPlaceholder')}
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
    </FormAccordion>
  );
}
