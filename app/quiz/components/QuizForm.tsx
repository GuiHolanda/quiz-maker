'use client';
import { getQuizQuestions } from '@/features/connectors';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { QuizFormErrors, StoredQuestion } from '@/types';
import { Form } from '@heroui/form';
import { BusyDialog } from '../../../sharedComponents/ui/BusyDialog';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Divider } from '@heroui/divider';
import { CertificationManager } from '../../../sharedComponents/CertificationManager';
import { SectionsTable } from '../../../sharedComponents/SectionsTable';
import { NumberInput } from '@heroui/number-input';
import { Button } from '@heroui/button';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { borderedInputClassNames } from '@/config/constants/inputStyles';

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
    <Accordion
      defaultExpandedKeys={['quizForm']}
      className="bg-content1 border border-default-200 rounded-xl overflow-hidden p-0"
      itemClasses={{
        base: 'border-0',
        title: 'text-sm font-bold text-foreground',
        trigger: 'px-6 py-4 hover:bg-content2 transition-colors duration-200',
        content: 'px-6 pb-6',
        indicator: 'text-default-400',
      }}
    >
      <AccordionItem title={t('quiz.configureQuiz')} key="quizForm">
        <Form onSubmit={handleSubmit} validationErrors={error}>
          <Divider />
          <div className="w-full flex flex-col gap-6 pt-4">
            <div className="flex gap-4 items-center">
              <CertificationManager isMultiple noTopics className="flex w-3/4 gap-4 items-center" />
              <NumberInput
                className="w-1/4"
                name="num_questions"
                label={t('common.numberOfQuestions')}
                placeholder={t('quiz.placeholder')}
                minValue={1}
                variant="bordered"
                classNames={borderedInputClassNames}
              />
            </div>
            <SectionsTable selectedCertification={selectedCertification} />
          </div>
          <div className="flex w-full justify-end pt-4">
            <Button
              type="submit"
              isLoading={loading}
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
            >
              {t('quiz.generateQuiz')}
            </Button>
          </div>
        </Form>
        <BusyDialog isOpen={loading} />
      </AccordionItem>
    </Accordion>
  );
}
