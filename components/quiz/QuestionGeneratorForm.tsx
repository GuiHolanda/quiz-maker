'use client';
import { getQuestions } from '@/features/quizGenerator.service';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { QuizParams, QuizFormErrors, Certification, AIQuestion } from '@/types';
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

interface QuestionareFormProps {
  onGenerated: (questions: AIQuestion[]) => void;
}

export function QuestionGeneratorForm({ onGenerated }: Readonly<QuestionareFormProps>) {
  const { certifications, selectedCertification, setSelectedCertification, removeCertification } =
    useCertificationsContext();
  
  const [isCertificationMode, setIsCertificationMode] = useState<boolean>(true);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);

  const { loading, error, setError, request } = useRequest(getQuestions);
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
    };

    const questions = await request(requestPayload);
    onGenerated(questions);
  };
  return (
    <Card className="p-2">
      <Accordion>
        <AccordionItem title="Configure the questionaire" classNames={{ title: 'text-md font-bold' }}>
          <Form onSubmit={handleSubmit} validationErrors={error}>
            <Divider />
            <div className="w-full flex flex-col gap-6 p-4">
              <Switch size="sm" isSelected={isCertificationMode} onValueChange={setIsCertificationMode}>
                Certification Mode
              </Switch>
              <div className="flex w-full gap-4 items-center">
                <Autocomplete
                  className="w-2/3"
                  label={isCertificationMode ? 'Select an Certification' : 'Selecione um Concurso'}
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
                <NewCertificationModal
                  isOpen={isOpen}
                  onOpenChange={onOpenChange}
                  onClose={onClose}
                  editingCertification={editingCert}
                />
                {!isCertificationMode && (
                  <Autocomplete
                    className="w-1/3"
                    label={isCertificationMode ? 'Select an Topic' : 'Selecione uma Banca'}
                    name="banca"
                    onSelectionChange={setSelectedTopic}
                  >
                  {certifications.map((certification) => (
                    <AutocompleteItem key={certification.key} textValue={certification.label}>
                      {certification.label}
                    </AutocompleteItem>
                  ))}
                  </Autocomplete>
                )}
                <Autocomplete
                  className="w-1/3"
                  label={isCertificationMode ? 'Select an Topic' : 'Selecione uma Matéria'}
                  name="topic"
                  onSelectionChange={setSelectedTopic}
                >
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
                      onClick={() => {
                        setEditingCert(null);
                        onOpen();
                      }}
                      key="new"
                      startContent={
                        <FontAwesomeIcon icon={faPlusCircle} className="text-success text-lg hover:scale-110" />
                      }
                    >
                      {isCertificationMode ? 'Add certification' : 'Adicionar concurso'}
                    </DropdownItem>
                    <DropdownItem
                      hidden={!selectedCertification}
                      key="edit"
                      onClick={() => {
                        setEditingCert(selectedCertification || null);
                        onOpen();
                      }}
                      startContent={
                        <FontAwesomeIcon icon={faPenSquare} className="text-info text-lg hover:scale-110" />
                      }
                    >
                      {isCertificationMode ? 'Edit certification' : 'Editar concurso'}
                    </DropdownItem>
                    <DropdownItem
                      hidden={!selectedCertification}
                      key="delete"
                      className="text-danger"
                      color="danger"
                      startContent={
                        <FontAwesomeIcon icon={faTrashCan} className="text-danger text-lg hover:scale-110" />
                      }
                      onClick={onDeleteCertification}
                    >
                      {isCertificationMode ? 'Delete certification' : 'Excluir concurso'}
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
