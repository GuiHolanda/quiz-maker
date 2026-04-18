'use client';
import { getQuizQuestions } from '@/features/connectors';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { QuizFormErrors, StoredQuestion } from '@/types';
import { Card } from '@heroui/card';
import { Form } from '@heroui/form';
import { BusyDialog } from '../../../sharedComponents/ui/BusyDialog';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Divider } from '@heroui/divider';
import { CertificationManager } from '../../../sharedComponents/CertificationManager';
import { SectionsTable } from '../../../sharedComponents/SectionsTable';
import { NumberInput } from '@heroui/number-input';
import { Button } from '@heroui/button';

interface QuizFormProps {
  onGenerated: (questions: StoredQuestion[]) => void;
}

export function QuizForm({ onGenerated }: Readonly<QuizFormProps>) {
  const { selectedCertification } = useCertificationsContext();
  const { loading, error, setError, request } = useRequest(getQuizQuestions);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const num_questions = formData.get('num_questions')?.toString().trim() ?? '';

    const newErrors: QuizFormErrors = {};
    if (!selectedCertification) newErrors.certificationTitle = 'Certification is required';
    if (!num_questions) newErrors.num_questions = 'Number of questions is required';
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
    <Card className="p-2">
      <Accordion defaultExpandedKeys={['quizForm']}>
        <AccordionItem title="Configure the quiz" classNames={{ title: 'text-md font-bold' }} key="quizForm">
          <Form onSubmit={handleSubmit} validationErrors={error}>
            <Divider />
            <div className="w-full flex flex-col gap-6 p-4">
              <div className="flex gap-4 items-center">
                <CertificationManager isMultiple noTopics className="flex w-3/4 gap-4 items-center" />
                <NumberInput
                  className="w-1/4"
                  name="num_questions"
                  label="Number of Questions"
                  placeholder="e.g. 20"
                  minValue={1}
                />
              </div>
              <SectionsTable selectedCertification={selectedCertification} />
            </div>
            <div className="flex w-full justify-end p-4">
              <Button type="submit" color="primary" isLoading={loading}>
                Generate Quiz
              </Button>
            </div>
          </Form>
          <BusyDialog isOpen={loading} />
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
