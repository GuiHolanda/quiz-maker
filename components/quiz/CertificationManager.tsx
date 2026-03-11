import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { NewCertificationModal } from './NewCertificationModal';
import { Select, SelectItem } from '@heroui/select';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faPenSquare, faPlusCircle, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@heroui/button';
import { useDisclosure } from '@heroui/modal';
import { useState } from 'react';
import { Certification } from '@/types';

interface CertificationManagerProps extends React.HTMLAttributes<HTMLDivElement> {
  isMultiple?: boolean;
  noTopics?: boolean;
}

export const CertificationManager = ({ isMultiple, noTopics, ...props }: CertificationManagerProps) => {
  const {
    certifications,
    selectedCertification,
    selectedTopics,
    setSelectedCertification,
    removeCertification,
    setSelectedTopics,
  } = useCertificationsContext();
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const onCertificationChange = (key: any) => {
    const certification = certifications.find((cert) => cert.key === key);
    setSelectedCertification(certification || null);
  };

  const onDeleteCertification = () => {
    if (selectedCertification) {
      removeCertification(selectedCertification.key);
      setSelectedCertification(null);
      setSelectedTopics([]);
    }
  };

  const onTopicsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = e.target.value;
    if (selectedValues) {
      const selectedTopics = selectedValues.split(',');
      setSelectedTopics(selectedTopics);
    } else {
      setSelectedTopics([]);
    }
  };

  return (
    <div className={props.className} {...props}>
      <Autocomplete
        className={noTopics ? 'w-full' : 'w-2/3'}
        label="Select an Certification"
        name="certificationTitle"
        onSelectionChange={onCertificationChange}
        selectedKey={selectedCertification?.key ?? ''}
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
      {!noTopics && (
        <Select
          className="w-1/3"
          label="Select an Topic"
          name="topic"
          onChange={onTopicsChange}
          selectionMode={isMultiple ? 'multiple' : 'single'}
          selectedKeys={selectedTopics}
        >
          {selectedCertification
            ? selectedCertification.topics.map((topic) => <SelectItem key={topic.name}>{topic.name}</SelectItem>)
            : []}
        </Select>
      )}
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
            startContent={<FontAwesomeIcon icon={faPlusCircle} className="text-success text-lg hover:scale-110" />}
          >
            Add certification
          </DropdownItem>
          <DropdownItem
            hidden={!selectedCertification}
            key="edit"
            onClick={() => {
              setEditingCert(selectedCertification || null);
              onOpen();
            }}
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
  );
};
