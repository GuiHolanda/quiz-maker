import { SectionsTable } from '@/shared/components/SectionsTable';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { inputProperties } from '@/config/constants/inputStyles';
import { FormAccordion } from '@/shared/components/ui/FormAccordion';

export function EditCertificationTab() {
  const { certifications, setSelectedCertification, selectedCertification, updateCertification } = useCertificationsContext();
  const { t } = useTranslation();

  const onCertificationChange = (key: any) => {
    const certification = certifications.find((cert) => cert.key === key);
    setSelectedCertification(certification || null);
  };

  const handleTopicChanged = (topicId: string, field: 'minQuestions' | 'maxQuestions', value: number) => {
    if (!selectedCertification) return;

    const updatedTopics = selectedCertification.topics.map((t) =>
      t.id === topicId ? { ...t, [field]: value } : t
    );

    updateCertification(selectedCertification.key, { topics: updatedTopics });
  };

  return (
    <FormAccordion
      title={t('certification.tabEdit')}
      accordionKey="edit-certification"
    >
      <Autocomplete
        label={t('certification.selectCertification')}
        className="w-3/4"
        name="certificationTitle"
        onSelectionChange={onCertificationChange}
        selectedKey={selectedCertification?.key ?? ''}
        placeholder={t('certification.selectCertificationPlaceholder')}
        {...inputProperties.autocomplete}
      >
        {certifications.map((certification) => (
          <AutocompleteItem key={certification.key} textValue={certification.label}>
            {certification.label}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      {selectedCertification && (
        <SectionsTable
          selectedCertification={selectedCertification}
          editable
          onTopicChanged={handleTopicChanged}
        />
      )}
    </FormAccordion>
  );
}
