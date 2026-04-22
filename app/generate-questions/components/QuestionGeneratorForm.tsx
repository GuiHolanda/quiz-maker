'use client';
import { getQuestions } from '@/features/connectors';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { QuizFormErrors, AIQuestion, QuestionParams } from '@/types';
import { Button } from '@heroui/button';
import { Form } from '@heroui/form';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Divider } from '@heroui/divider';
import { NumberInput } from '@heroui/number-input';
import { CertificationManager } from '@/sharedComponents/CertificationManager';
import { BusyDialog } from '@/sharedComponents/ui/BusyDialog';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { borderedInputClassNames } from '@/config/constants/inputStyles';

interface QuestionareFormProps {
  onGenerated: (questions: AIQuestion[]) => void;
}

export function QuestionGeneratorForm({ onGenerated }: Readonly<QuestionareFormProps>) {
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

    const questions = await request(requestPayload);
    if (questions) {
      onGenerated(questions);
    }
  };
  return (
    <div className="bg-content1 border border-default-200 rounded-xl">
      <Accordion
        defaultExpandedKeys={['configure questionaire']}
        itemClasses={{
          base: 'border-0',
          title: 'text-sm font-bold text-foreground',
          trigger: 'px-6 py-4 hover:bg-default-100 transition-colors duration-200',
          content: 'px-6 pb-6',
          indicator: 'text-default-400',
        }}
      >
        <AccordionItem
          title={t('generate.configureQuestionnaire')}
          key="configure questionaire"
        >
          <Form onSubmit={handleSubmit} validationErrors={error}>
            <Divider />
            <div className="w-full flex flex-col gap-6 pt-4">
              <div className="flex w-full gap-4 items-center">
                <CertificationManager className="flex w-full gap-4 items-center" />
              </div>
              <div className="flex w-full items-baseline gap-4">
                <NumberInput
                  id="num_questions"
                  name="num_questions"
                  className="w-1/4"
                  placeholder={t('common.numberOfQuestions')}
                  aria-label={t('common.numberOfQuestions')}
                  maxValue={20}
                  minValue={1}
                  variant="bordered"
                  classNames={borderedInputClassNames}
                />
                <Button
                  className="ml-auto mt-auto bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
                  type="submit"
                  disabled={loading}
                >
                  {t('common.generate')}
                </Button>
              </div>
            </div>
          </Form>
          <BusyDialog isOpen={loading} />
        </AccordionItem>
      </Accordion>
    </div>
  );
}
