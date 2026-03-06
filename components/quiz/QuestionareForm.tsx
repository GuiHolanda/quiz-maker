'use client';
import { getQuestions } from '@/features/quizGenerator.service';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { Question, QuizParams, QuizFormErrors, Certification, QuestionParams } from '@/types';
import { Button } from '@heroui/button';
import { Card } from '@heroui/card';
import { Form } from '@heroui/form';
import { Input } from '@heroui/input';
import { Slider } from '@heroui/slider';
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
import { CertificationManager } from './CertificationManager';

interface QuestionareFormProps {
  onGenerated: (questions: Question[]) => void;
}

export function QuestionareForm({ onGenerated }: Readonly<QuestionareFormProps>) {
  const { certifications, selectedCertification, setSelectedCertification, removeCertification } =
    useCertificationsContext();
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const { loading, error, setError, request } = useRequest(getQuestions);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const onCertificationChange = (key: any) => {
    const certification = certifications.find((cert) => cert.key === key);
    setSelectedCertification(certification || null);
  };

  const onDeleteCertification = () => {
    if (selectedCertification) {
      removeCertification(selectedCertification.key);
      setSelectedCertification(null);
      setSelectedTopic(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const num_questions = formData.get('num_questions')?.toString().trim() ?? '10';
    const newQuestionsPercentage = formData.get('newQuestionsPercentage')?.toString().trim();

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
                <CertificationManager />
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
                  max={20}
                  min={1}
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
                  label="New Questions"
                  size="sm"
                  defaultValue={1}
                  maxValue={1}
                  minValue={0}
                  showTooltip={true}
                  step={0.1}
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
