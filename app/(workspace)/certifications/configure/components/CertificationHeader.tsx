'use client';
import { Input } from '@heroui/input';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface CertificationHeaderProps {
  title: string;
  code: string;
  onTitleChange: (value: string) => void;
  onCodeChange: (value: string) => void;
}

export function CertificationHeader({ title, code, onTitleChange, onCodeChange }: Readonly<CertificationHeaderProps>) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-4 mb-4">
      <Input
        className="w-2/3"
        label={t('certification.certificationTitle')}
        placeholder={t('certification.certificationTitlePlaceholder')}
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        {...inputProperties.input}
      />
      <Input
        className="w-1/3"
        label={t('certification.certificationCode')}
        placeholder={t('certification.certificationCodePlaceholder')}
        type="text"
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        {...inputProperties.input}
      />
    </div>
  );
}
