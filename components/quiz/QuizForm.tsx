'use client';
import { getQuestions } from '@/features/connectors';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { QuizFormErrors, QuestionParams, AIQuestion } from '@/types';
import { Card } from '@heroui/card';
import { Form } from '@heroui/form';
import { BusyDialog } from '../ui/BusyDialog';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Divider } from '@heroui/divider';
import { CertificationManager } from './CertificationManager';
import { SectionsTable } from './SectionsTable';
import { NumberInput } from '@heroui/number-input';

interface QuestionareFormProps {
  onGenerated: (questions: AIQuestion[]) => void;
}

export function QuizForm({ onGenerated }: Readonly<QuestionareFormProps>) {
  const { selectedCertification, selectedTopics } = useCertificationsContext();
  const { loading, error, setError, request } = useRequest(getQuestions);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const num_questions = formData.get('num_questions')?.toString().trim() ?? '10';

    const newErrors: QuizFormErrors = {};
    if (!selectedCertification) newErrors.certificationTitle = 'Certification Title is required';
    if (!selectedTopics.length) newErrors.topic = 'Topic is required';
    if (!num_questions) newErrors.num_questions = 'Number of questions is required';
    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    const requestPayload: QuestionParams = {
      certification_name: selectedCertification?.label || '',
      topic_name: selectedTopics.join(', '),
      num_questions: num_questions,
    };

    const questions = await request(requestPayload);
    onGenerated(questions);
  };
  return (
    <Card className="p-2">
      <Accordion defaultExpandedKeys={['quizForm']}>
        <AccordionItem title="Configure the questionaire" classNames={{ title: 'text-md font-bold' }} key="quizForm">
          <Form onSubmit={handleSubmit} validationErrors={error}>
            <Divider />
            <div className="w-full flex flex-col gap-6 p-4">
              <div className="flex gap-4 items-center">
                <CertificationManager isMultiple noTopics className='flex w-3/4 gap-4 items-center'/>
                <NumberInput className="w-1/4" placeholder="Number of Questions" aria-label="Number of Questions" />
              </div>
              <div className="flex w-full items-baseline gap-4">
                <SectionsTable selectedCertification={selectedCertification} />
              </div>
            </div>
            <div className="flex flex-col gap-6 md:gap-0 md:flex-row md:items-end"></div>
          </Form>
          <BusyDialog isOpen={loading} />
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
