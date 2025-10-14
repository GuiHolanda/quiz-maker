'use client';
import { getQuestions } from '@/features/quizGenerator.service';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { QuizForm, Question } from '@/types';
import { Button } from '@heroui/button';
import { CardBody } from '@heroui/card';
import { Form } from '@heroui/form';
import { Input } from '@heroui/input';
import { Slider } from '@heroui/slider';
import { BusyDialog } from '../ui/BusyDialog';

interface QuestionareFormProps {
  onGenerated: (questions: Question[]) => void;
}

export function QuestionareForm({ onGenerated }: Readonly<QuestionareFormProps>) {
  const { loading, error, setError, request } = useRequest(getQuestions);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const topic = formData.get('topic')?.toString().trim();
    const num_questions = formData.get('num_questions')?.toString().trim();

    const newErrors: Partial<QuizForm> = {};
    if (!topic) newErrors.topic = 'Topic is required';
    if (!num_questions) newErrors.num_questions = 'Number of questions is required';
    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    const questions = await request(formData, () => form.reset());
    onGenerated(questions);
  };
  return (
    <>
      <Form onSubmit={handleSubmit} validationErrors={error}>
        <CardBody>
          <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
            <Input
              id="topic"
              name="topic"
              className="w-2/4"
              label="Quiz Topic"
              type="text"
              labelPlacement="outside-top"
              variant="underlined"
              classNames={{
                inputWrapper: 'border-b-2',
                label: 'text-xs text-stone-400',
              }}
            />
            <Input
              id="num_questions"
              name="num_questions"
              className="w-fit"
              classNames={{
                inputWrapper: 'border-b-2',
                label: 'text-xs text-stone-400',
              }}
              label="Number of Questions"
              type="number"
              variant="underlined"
              labelPlacement="outside-top"
              max={20}
            />

            <Slider
              className="w-48"
              classNames={{
                label: 'text-xs text-stone-400 mb-8',
                value: 'text-xs font-bolde items-start',
                thumb: 'h-3 w-4',
              }}
              name={`newQuestionsPercentage`}
              formatOptions={{ style: 'percent' }}
              label="Generated percentage"
              size="sm"
              maxValue={1}
              minValue={0}
              showTooltip={true}
              step={0.1}
            />

            <Button className="ml-auto bg-primary" variant="flat" type="submit" disabled={loading}>
              Generate
            </Button>
          </div>
          <div className="flex flex-col gap-6 md:gap-0 md:flex-row md:items-end">
          </div>
        </CardBody>
      </Form>
      <BusyDialog isOpen={loading} />
    </>
  );
}
