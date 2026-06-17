import { Select, SelectItem } from '@heroui/select';

import { SectionsTable } from '@/shared/components/SectionsTable';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { FormAccordion } from '@/shared/components/ui/FormAccordion';

export function EditCertificationTab() {
  const { certifications, setSelectedCertification, selectedCertification, updateCertification } =
    useCertificationsContext();
  const { t } = useTranslation();

  const onCertificationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const certification = certifications.find((cert) => cert.key === e.target.value);

    setSelectedCertification(certification || null);
  };

  const handleTopicChanged = (topicId: string, field: 'minQuestions' | 'maxQuestions', value: number) => {
    if (!selectedCertification) return;

    const updatedTopics = selectedCertification.topics.map((t) => (t.id === topicId ? { ...t, [field]: value } : t));

    updateCertification(selectedCertification.key, { topics: updatedTopics });
  };

  return (
    <FormAccordion accordionKey="edit-certification" title={t('certification.tabEdit')}>
      <Select
        className="w-3/4"
        label={t('certification.selectCertification')}
        name="certificationTitle"
        placeholder={t('certification.selectCertificationPlaceholder')}
        selectedKeys={selectedCertification ? [selectedCertification.key] : []}
        onChange={onCertificationChange}
        {...inputProperties.select}
      >
        {certifications.map((certification) => (
          <SelectItem key={certification.key}>{certification.label}</SelectItem>
        ))}
      </Select>
      {selectedCertification && (
        <SectionsTable editable selectedCertification={selectedCertification} onTopicChanged={handleTopicChanged} />
      )}
    </FormAccordion>
  );
}
