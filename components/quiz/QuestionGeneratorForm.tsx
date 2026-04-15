'use client';
import { getQuestions } from '@/features/connectors';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { QuizParams, QuizFormErrors, Certification, AIQuestion, QuestionParams } from '@/types';
import { Button } from '@heroui/button';
import { Card } from '@heroui/card';
import { Form } from '@heroui/form';
import { Input } from '@heroui/input';
import { BusyDialog } from '../ui/BusyDialog';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { useState } from 'react';
import { useDisclosure } from '@heroui/modal';
import { faEllipsisVertical, faPenSquare, faPlusCircle, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NewCertificationModal } from './NewCertificationModal';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Divider } from '@heroui/divider';
import { Switch } from '@heroui/switch';
import { CertificationManager } from './CertificationManager';
import { NumberInput } from '@heroui/number-input';

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
      setError(newErrors);
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
    <Card className="p-2">
      <Accordion defaultExpandedKeys={['configure questionaire']}>
        <AccordionItem
          title="Configure the questionaire"
          classNames={{ title: 'text-md font-bold' }}
          key="configure questionaire"
        >
          <Form onSubmit={handleSubmit} validationErrors={error}>
            <Divider />
            <div className="w-full flex flex-col gap-6 p-4">
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
