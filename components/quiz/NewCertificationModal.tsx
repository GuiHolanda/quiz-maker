import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { Certification, CertificationTopic } from '@/types';
import { faCirclePlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Input } from '@heroui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { useRef, useState, useEffect } from 'react';
import { addToast } from '@heroui/toast';
import { Slider } from '@heroui/slider';
import { Form } from '@heroui/form';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell
} from "@heroui/table";
const TOPICS_TABLE_HEADERS = [{ key: 'topic', label: 'Topic Name' }, { key: 'minQuestions', label: 'Min Questions' }, { key: 'maxQuestions', label: 'Max Questions' }, { key: 'actions', label: 'Actions' }];

export const NewCertificationModal = ({
  isOpen,
  onOpenChange,
  onClose,
  editingCertification,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClose: () => void;
  editingCertification?: Certification | null;
}) => {
  const { addCertification, updateCertification } = useCertificationsContext();
  const [topicsList, setTopicsList] = useState<CertificationTopic[]>([...(editingCertification?.topics || [])]);
  const [topicName, setTopicName] = useState<string>('');

  const topicNameInputRef = useRef<HTMLInputElement>(null);
  const certificationTitleInputRef = useRef<HTMLInputElement>(null);
  const certificationCodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && editingCertification) {
      setTopicsList([...editingCertification.topics]);
      if (certificationTitleInputRef.current) certificationTitleInputRef.current.value = editingCertification.label;
      if (certificationCodeInputRef.current) certificationCodeInputRef.current.value = editingCertification.key;
      return;
    }
    if (!isOpen) {
      setTopicsList([]);
      setTopicName('');
      if (topicNameInputRef.current) topicNameInputRef.current.value = '';
      if (certificationTitleInputRef.current) certificationTitleInputRef.current.value = '';
      if (certificationCodeInputRef.current) certificationCodeInputRef.current.value = '';
    }
  }, [isOpen, editingCertification]);

  const onAddTopic = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const topicName = formData.get('topicName')?.toString().trim();
    const minQuestionsStr = formData.get('minQuestions')?.toString().trim();
    const maxQuestionsStr = formData.get('maxQuestions')?.toString().trim();

    const minQuestions = minQuestionsStr ? parseFloat(minQuestionsStr) : 0;
    const maxQuestions = maxQuestionsStr ? parseFloat(maxQuestionsStr) : 0;
    const name = topicName?.trim();
    if (!name) return;
    if (topicsList.some((t) => t.name === name)) return;
    setTopicsList((prev) => [...prev, { name, minQuestions, maxQuestions }]);
    setTopicName('');
    if (topicNameInputRef.current) topicNameInputRef.current.value = '';
  };

  const onRemoveTopic = (topic: CertificationTopic) => {
    setTopicsList((prev) => prev.filter((t) => t.name !== topic.name));
  };

  const onSaveCertification = () => {
    const certificationTitle = certificationTitleInputRef.current?.value.trim();
    const certificationCode = certificationCodeInputRef.current?.value.trim();

    if (!certificationTitle || !certificationCode) {
      addToast({
        title: `Error saving certification`,
        description: 'Certification title or code cannot be empty.',
        color: 'danger',
      });
      return;
    }

    if (editingCertification) {
      updateCertification(editingCertification.key, {
        label: certificationTitle,
        key: certificationCode,
        topics: topicsList,
      });
    } else {
      addCertification({
        label: certificationTitle,
        key: certificationCode,
        topics: topicsList,
      });
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="5xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Register a new Certification</ModalHeader>
        <ModalBody className="w-full">
          <div className="flex gap-4 mb-4">
            <Input label="Certification Title" type="text" className="w-2/3" ref={certificationTitleInputRef} />
            <Input label="Certification Code" type="text" className="w-1/3" ref={certificationCodeInputRef} />
          </div>
          <h4 className="font-bold">Topics</h4>
          <Form className="flex flex-row items-center gap-6" onSubmit={onAddTopic}>
            <Input
              label="Topic Name"
              type="text"
              name='topicName'
              ref={topicNameInputRef}
              value={topicName}
              onChange={(e: any) => setTopicName(e?.target?.value ?? '')}
              className='max-w-md'
            />
            <Slider
              className="w-48"
              classNames={{
                label: 'text-xs text-stone-400 font-bold mb-4',
                value: 'text-xs font-bold',
                labelWrapper: 'flex flex-col items-start',
                thumb: 'h-3 w-4',
              }}
              name="minQuestions"
              formatOptions={{ style: 'percent' }}
              label="Min Questions"
              size="sm"
              defaultValue={0.15}
              maxValue={1}
              minValue={0}
              showTooltip={true}
              step={0.1}
            />
            <Slider
              className="w-48"
              classNames={{
                label: 'text-xs text-stone-400 font-bold mb-4',
                value: 'text-xs font-bold',
                labelWrapper: 'flex flex-col items-start',
                thumb: 'h-3 w-4',
              }}
              name="maxQuestions"
              formatOptions={{ style: 'percent' }}
              label="Max Questions"
              size="sm"
              defaultValue={0.30}
              maxValue={1}
              minValue={0}
              showTooltip={true}
              step={0.1}
            />
            <Button size="sm" variant="light" type="submit">
              <FontAwesomeIcon icon={faCirclePlus} className="text-success text-2xl" />
            </Button>
          </Form>
          <Divider />
          <div className="flex flex-wrap gap-2 mt-2">
            {topicsList.length === 0 && <p className="text-sm italic text-zinc-400">No topics added yet</p>}
            {topicsList.length > 0 && (
              <Table isStriped aria-label="Example static collection table">
                <TableHeader columns={TOPICS_TABLE_HEADERS}>
                    {(column) => (
                      <TableColumn key={column.key}>{column.label}</TableColumn>
                    )}
                </TableHeader>
                <TableBody items={topicsList}>
                  {(topic) => (
                    <TableRow key={topic.name}>
                      <TableCell>{topic.name}</TableCell>
                      <TableCell>{topic.minQuestions.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 })}</TableCell>
                      <TableCell>{topic.maxQuestions.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 })}</TableCell>
                      <TableCell>
                        <Button  onPress={() => onRemoveTopic(topic)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="default" onPress={onClose}>
            Close
          </Button>
          <Button color="primary" onPress={onSaveCertification}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
