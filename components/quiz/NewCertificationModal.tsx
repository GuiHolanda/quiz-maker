import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { Certification } from '@/types';
import { faCirclePlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Input } from '@heroui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Badge } from '@heroui/badge';
import { useRef, useState, useEffect } from 'react';
import { addToast } from '@heroui/toast';

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
  const [topicsList, setTopicsList] = useState<string[]>([...(editingCertification?.topics || [])]);
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

  const onAddTopic = () => {
    const name = topicName?.trim();
    if (!name) return;
    if (topicsList.includes(name)) return;
    setTopicsList((prev) => [...prev, name]);
    setTopicName('');
    if (topicNameInputRef.current) topicNameInputRef.current.value = '';
  };

  const onRemoveTopic = (topic: string) => {
    setTopicsList((prev) => prev.filter((t) => t !== topic));
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
          <div className="flex items-center gap-4 max-w-2xl">
            <Input
              label="Topic Name"
              type="text"
              ref={topicNameInputRef}
              value={topicName}
              onChange={(e: any) => setTopicName(e?.target?.value ?? '')}
            />
            <Button size="sm" variant="light" onPress={onAddTopic}>
              <FontAwesomeIcon icon={faCirclePlus} className="text-success text-2xl" />
            </Button>
          </div>
          <Divider />
          <div className="flex flex-wrap gap-2 mt-2">
            {topicsList.length === 0 && <p className="text-sm italic text-zinc-400">No topics added yet</p>}
            {topicsList.map((topic) => (
              <Badge
                showOutline={false}
                size='sm'
                isOneChar
                key={topic}
                color='danger'
                content={<FontAwesomeIcon icon={faXmark}  size='xs'/>}
                onClick={() => onRemoveTopic(topic)}
                className="hover:scale-105"
              >
                <Chip color="primary">{topic}</Chip>
              </Badge>
            ))}
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
