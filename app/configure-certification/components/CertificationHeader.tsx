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
        label={t('certification.certificationTitle')}
        type="text"
        className="w-2/3"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t('certification.certificationTitlePlaceholder')}
        {...inputProperties.input}
      />
      <Input
        label={t('certification.certificationCode')}
        type="text"
        className="w-1/3"
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        placeholder={t('certification.certificationCodePlaceholder')}
        {...inputProperties.input}
      />
    </div>
  );
}
