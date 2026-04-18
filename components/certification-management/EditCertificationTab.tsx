import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { SectionsTable } from '../quiz/SectionsTable';
import { Certification, CertificationTopic } from '@/types';

export function EditCertificationTab() {
  const { certifications, setSelectedCertification, selectedCertification, updateCertification } = useCertificationsContext();

  const onCertificationChange = (key: any) => {
    const certification = certifications.find((cert) => cert.key === key);
    setSelectedCertification(certification || null);
  };

  const handleTopicChanged = (topicName: string, field: 'minQuestions' | 'maxQuestions', value: number) => {
    if (!selectedCertification) return;

    const updatedTopics = selectedCertification.topics.map((t) =>
      t.name === topicName ? { ...t, [field]: value } : t
    );

    updateCertification(selectedCertification.key, { topics: updatedTopics });
  };

  return (
    <>
      <Autocomplete
        label="Select an Certification"
        className='w-3/4 mt-4'
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
      {selectedCertification && (
        <div className='mt-4'>
          <SectionsTable
            selectedCertification={selectedCertification}
            editable
            onTopicChanged={handleTopicChanged}
          />
        </div>
      )}
    </>
  );
}
