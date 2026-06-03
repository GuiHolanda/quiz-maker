'use client';
import { getPublicExamQuestions } from '@/features/connectors';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { PublicExamFormErrors, AIPublicExamQuestion, PublicExamQuestionParams } from '@/shared/types';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
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
      title={t('concurso.configureGenerator')}
      accordionKey="configure-public-exam-generator"
      onSubmit={handleSubmit}
      validationErrors={error as Record<string, string>}
      isLoading={loading}
    >
      <PublicExamManager className="flex w-full gap-4 items-end" showTopic />
      <div className="flex w-full items-end gap-4">
        <div className="no-number-spinners w-1/4">
          <Input
            id="num_questions"
            name="num_questions"
            type="number"
            label={t('common.numberOfQuestions')}
            placeholder={t('concurso.numQuestionsPlaceholder')}
            max={20}
            min={1}
            {...inputProperties.input}
          />
        </div>
        <Button
          className="ml-auto bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
          type="submit"
          disabled={loading}
        >
          {t('common.generate')}
        </Button>
      </div>
    </FormAccordion>
  );
}
