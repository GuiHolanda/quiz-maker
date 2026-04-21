import { SectionsTable } from '@/sharedComponents/SectionsTable';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';


export function EditCertificationTab() {
  const { certifications, setSelectedCertification, selectedCertification, updateCertification } = useCertificationsContext();
  const { t } = useTranslation();

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
    <div className="clay-section p-6 mt-2">
      <Autocomplete
        label={t('certification.selectCertification')}
        className='w-3/4'
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
        <div className='mt-6'>
          <SectionsTable
            selectedCertification={selectedCertification}
            editable
            onTopicChanged={handleTopicChanged}
          />
        </div>
      )}
    </div>
  );
}
