'use client';
import { getQuestions } from '@/features/connectors';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { Question, QuizParams, QuizFormErrors, QuestionParams } from '@/types';
import { Button } from '@heroui/button';
import { Card } from '@heroui/card';
import { Form } from '@heroui/form';
import { Input } from '@heroui/input';
import { BusyDialog } from '../ui/BusyDialog';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Divider } from '@heroui/divider';
import { CertificationManager } from './CertificationManager';

interface QuestionareFormProps {
  onGenerated: (questions: Question[]) => void;
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
    <Card>
      <Accordion>
        <AccordionItem title="Configure the questionaire" classNames={{ title: 'text-md font-bold' }}>
          <Form onSubmit={handleSubmit} validationErrors={error}>
            <Divider />
            <div className="w-full flex flex-col gap-6 p-4">
              <div className="flex w-full gap-4 items-center">
                <CertificationManager isMultiple/>
              </div>
              <div className="flex w-full items-baseline gap-4">
                <Input
                  id="num_questions"
                  name="num_questions"
                  className="w-48"
                  classNames={{
                    inputWrapper: 'border-b-2',
                    label: 'text-xs text-stone-400',
                  }}
                  label="Number of Questions"
                  type="number"
                  variant="underlined"
                  labelPlacement="outside-top"
                  min={1}
                />
                <Button className="ml-auto mt-auto bg-primary" variant="flat" type="submit" disabled={loading}>
                  Generate
                </Button>
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
