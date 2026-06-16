'use client';

import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { Select, SelectItem } from '@heroui/select';
import { inputProperties } from '@/config/constants/inputStyles';

interface CertificationManagerProps extends React.HTMLAttributes<HTMLDivElement> {
  isMultiple?: boolean;
  noTopics?: boolean;
}

export const CertificationManager = ({ isMultiple, noTopics, ...props }: CertificationManagerProps) => {
  const { t } = useTranslation();
  const {
    certifications,
    selectedCertification,
    selectedTopics,
    setSelectedCertification,
    setSelectedTopics,
  } = useCertificationsContext();

  const onCertificationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const certification = certifications.find((cert) => cert.key === e.target.value);
    setSelectedCertification(certification || null);
  };

  const onTopicsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = e.target.value;
    if (selectedValues) {
      setSelectedTopics(selectedValues.split(','));
    } else {
      setSelectedTopics([]);
    }
  };

  return (
    <div className={props.className} {...props}>
      <Select
        className={noTopics ? 'w-full' : 'w-2/3'}
        label={t('certification.selectCertification')}
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
      {!noTopics && (
        <Select
          className="w-1/3"
          label={t('certification.selectTopic')}
          name="topic"
          onChange={onTopicsChange}
          selectionMode={isMultiple ? 'multiple' : 'single'}
          selectedKeys={selectedTopics}
          placeholder={t('certification.selectTopicPlaceholder')}
          {...inputProperties.select}
        >
          {selectedCertification
            ? selectedCertification.topics.map((topic) => <SelectItem key={topic.name}>{topic.name}</SelectItem>)
            : []}
        </Select>
      )}
    </div>
  );
};
