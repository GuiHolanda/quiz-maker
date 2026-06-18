'use client';

import { Select, SelectItem } from '@heroui/select';
import type { Selection } from '@react-types/shared';

import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface CertificationManagerProps extends React.HTMLAttributes<HTMLDivElement> {
  isMultiple?: boolean;
  noTopics?: boolean;
}

export const CertificationManager = ({ isMultiple, noTopics, ...props }: CertificationManagerProps) => {
  const { t } = useTranslation();
  const { certifications, selectedCertification, selectedTopics, setSelectedCertification, setSelectedTopics } =
    useCertificationsContext();

  const onCertificationChange = (keys: Selection) => {
    if (keys === 'all') return;
    const key = Array.from(keys as Set<React.Key>)[0];
    const certification = certifications.find((cert) => cert.key === String(key));

    setSelectedCertification(certification || null);
  };

  const onTopicsChange = (keys: Selection) => {
    if (keys === 'all') return;
    setSelectedTopics(Array.from(keys as Set<React.Key>).map(String));
  };

  return (
    <div className={props.className} {...props}>
      <Select
        className={noTopics ? 'w-full' : 'w-2/3'}
        label={t('certification.selectCertification')}
        name="certificationTitle"
        placeholder={t('certification.selectCertificationPlaceholder')}
        selectedKeys={selectedCertification ? [selectedCertification.key] : []}
        onSelectionChange={onCertificationChange}
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
          placeholder={t('certification.selectTopicPlaceholder')}
          selectedKeys={selectedTopics}
          selectionMode={isMultiple ? 'multiple' : 'single'}
          onSelectionChange={onTopicsChange}
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
