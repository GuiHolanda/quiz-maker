import { SectionsTable } from '@/shared/components/SectionsTable';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { Select, SelectItem } from '@heroui/select';
import { inputProperties } from '@/config/constants/inputStyles';
import { FormAccordion } from '@/shared/components/ui/FormAccordion';

export function EditCertificationTab() {
  const { certifications, setSelectedCertification, selectedCertification, updateCertification } = useCertificationsContext();
  const { t } = useTranslation();

  const onCertificationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const certification = certifications.find((cert) => cert.key === e.target.value);
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
      <Select
        label={t('certification.selectCertification')}
        className="w-3/4"
        name="certificationTitle"
        onChange={onCertificationChange}
        selectedKeys={selectedCertification ? [selectedCertification.key] : []}
        placeholder={t('certification.selectCertificationPlaceholder')}
        {...inputProperties.select}
      >
        {certifications.map((certification) => (
          <SelectItem key={certification.key}>{certification.label}</SelectItem>
        ))}
      </Select>
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
