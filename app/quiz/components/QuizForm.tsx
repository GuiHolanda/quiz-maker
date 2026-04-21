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
    <div className="clay-section">
      <Accordion
        defaultExpandedKeys={['quizForm']}
        itemClasses={{
          base: 'border-0',
          title: 'text-sm font-bold text-white/80',
          trigger: 'px-6 py-4 hover:bg-white/[0.02] transition-colors duration-200',
          content: 'px-6 pb-6',
          indicator: 'text-white/30',
        }}
      >
        <AccordionItem title="Configure the quiz" key="quizForm">
          <Form onSubmit={handleSubmit} validationErrors={error}>
            <Divider className="clay-divider" />
            <div className="w-full flex flex-col gap-6 pt-4">
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
            <div className="flex w-full justify-end pt-4">
              <Button
                type="submit"
                isLoading={loading}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-[0_4px_14px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.55)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Generate Quiz
              </Button>
            </div>
          </Form>
          <BusyDialog isOpen={loading} />
        </AccordionItem>
      </Accordion>
    </div>
  );
}
