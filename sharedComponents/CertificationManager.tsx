import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { Select, SelectItem } from '@heroui/select';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
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
  const onCertificationChange = (key: any) => {
    const certification = certifications.find((cert) => cert.key === key);
    setSelectedCertification(certification || null);
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
    </div>
  );
};
