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

interface QuestionareFormProps {
  onGenerated: (questions: AIQuestion[]) => void;
}

export function QuestionGeneratorForm({ onGenerated }: Readonly<QuestionareFormProps>) {
  const { selectedCertification, selectedTopics } = useCertificationsContext();
  const { loading, error, setError, request } = useRequest(getQuestions);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const num_questions = formData.get('num_questions')?.toString().trim() ?? '5';
    const selectedTopic = selectedTopics[0];

    const newErrors: QuizFormErrors = {};
    if (!selectedCertification) newErrors.certificationTitle = 'Certification Title is required';
    if (!selectedTopic) newErrors.topic = 'Topic is required';
    if (!num_questions) newErrors.num_questions = 'Number of questions is required';
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
    <div className="clay-section">
      <Accordion
        defaultExpandedKeys={['configure questionaire']}
        itemClasses={{
          base: 'border-0',
          title: 'text-sm font-bold text-white/80',
          trigger: 'px-6 py-4 hover:bg-white/[0.02] transition-colors duration-200',
          content: 'px-6 pb-6',
          indicator: 'text-white/30',
        }}
      >
        <AccordionItem
          title="Configure the questionnaire"
          key="configure questionaire"
        >
          <Form onSubmit={handleSubmit} validationErrors={error}>
            <Divider className="clay-divider" />
            <div className="w-full flex flex-col gap-6 pt-4">
              <div className="flex w-full gap-4 items-center">
                <CertificationManager className="flex w-full gap-4 items-center" />
              </div>
              <div className="flex w-full items-baseline gap-4">
                <NumberInput
                  id="num_questions"
                  name="num_questions"
                  className="w-1/4"
                  placeholder="Number of Questions"
                  aria-label="Number of Questions"
                  maxValue={20}
                  minValue={1}
                />
                <Button
                  className="ml-auto mt-auto bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-[0_4px_14px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.55)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                  type="submit"
                  disabled={loading}
                >
                  Generate
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
