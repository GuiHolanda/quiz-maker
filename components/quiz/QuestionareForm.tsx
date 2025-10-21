'use client';
import { getQuestions } from '@/features/quizGenerator.service';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { Question, QuizParams, QuizFormErrors } from '@/types';
import { Button } from '@heroui/button';
import { CardBody } from '@heroui/card';
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

interface QuestionareFormProps {
  onGenerated: (questions: Question[]) => void;
}

export function QuestionareForm({ onGenerated }: Readonly<QuestionareFormProps>) {
  const { certifications, selectedCertification, setSelectedCertification, removeCertification } =
    useCertificationsContext();
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

    const num_questions = formData.get('num_questions')?.toString().trim();
    const newQuestionsPercentage = formData.get('newQuestionsPercentage')?.toString().trim();

    const newErrors: QuizFormErrors = {};
    if (!selectedCertification) newErrors.certificationTitle = 'Certification Title is required';
    if (!selectedTopic) newErrors.topic = 'Topic is required';
    if (!num_questions) newErrors.num_questions = 'Number of questions is required';
    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    const requestPayload: QuizParams = {
      certificationTitle: selectedCertification?.label || '',
      topic: selectedTopic,
      numQuestions: Number(num_questions),
      newPercent: Number(newQuestionsPercentage) || 0.3,
    };

    const questions = await request(requestPayload, () => form.reset());
    onGenerated(questions);
  };
  return (
    <>
      <Form onSubmit={handleSubmit} validationErrors={error}>
        <CardBody>
          <div className="flex flex-col gap-6 py-4">
            <div className="flex w-full gap-4 items-center">
              <Autocomplete
                className="w-2/3"
                label="Select an Certification"
                name="certificationTitle"
                onSelectionChange={onCertificationChange}
                selectedKey={selectedCertification?.key}
              >
                {certifications.map((certification) => (
                  <AutocompleteItem key={certification.key} textValue={certification.label}>
                    {certification.label}
                  </AutocompleteItem>
                ))}
              </Autocomplete>
              <NewCertificationModal isOpen={isOpen} onOpenChange={onOpenChange} onClose={onClose} />
              <Autocomplete className="w-1/3" label="Select an Topic" name="topic" onSelectionChange={setSelectedTopic}>
                {selectedCertification
                  ? selectedCertification.topics.map((topic) => (
                      <AutocompleteItem key={topic}>{topic}</AutocompleteItem>
                    ))
                  : []}
              </Autocomplete>
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="light" size="sm">
                    <FontAwesomeIcon icon={faEllipsisVertical} className="text-2xl" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Dropdown menu with icons" variant="faded">
                  <DropdownItem
                    onClick={onOpen}
                    key="new"
                    startContent={
                      <FontAwesomeIcon icon={faPlusCircle} className="text-success text-lg hover:scale-110" />
                    }
                  >
                    Add certification
                  </DropdownItem>
                  <DropdownItem
                    key="edit"
                    startContent={<FontAwesomeIcon icon={faPenSquare} className="text-info text-lg hover:scale-110" />}
                  >
                    Edit certification
                  </DropdownItem>
                  <DropdownItem
                    hidden={!selectedCertification}
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={<FontAwesomeIcon icon={faTrashCan} className="text-danger text-lg hover:scale-110" />}
                    onClick={onDeleteCertification}
                  >
                    Delete certification
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
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
        </CardBody>
      </Form>
      <BusyDialog isOpen={loading} />
    </>
  );
}
