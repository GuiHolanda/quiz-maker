'use client';
import { faArrowRight, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { addToast } from '@heroui/toast';

import { inputProperties } from '@/config/constants/inputStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { StepHeader } from './StepHeader';

interface Step1BasicInfoProps {
  readonly title: string;
  readonly code: string;
  readonly provider: string;
  readonly onTitleChange: (v: string) => void;
  readonly onCodeChange: (v: string) => void;
  readonly onProviderChange: (v: string) => void;
  readonly onBack: () => void;
  readonly onNext: () => void;
}

const PROVIDERS = [
  { key: 'aws', labelKey: 'certification.providerAws' },
  { key: 'microsoft', labelKey: 'certification.providerMicrosoft' },
  { key: 'google', labelKey: 'certification.providerGoogle' },
  { key: 'comptia', labelKey: 'certification.providerComptia' },
  { key: 'cisco', labelKey: 'certification.providerCisco' },
] as const;

export function Step1BasicInfo({
  title, code, provider,
  onTitleChange, onCodeChange, onProviderChange,
  onBack, onNext,
}: Step1BasicInfoProps) {
  const { t } = useTranslation();

  const handleNext = () => {
    if (!title.trim() || !code.trim()) {
      addToast({ title: t('toast.validationError'), description: t('error.titleCodeRequired'), color: 'danger' });
      return;
    }
    onNext();
  };

  const handleSaveDraft = () => {
    addToast({ title: t('toast.success'), description: t('toast.savedSuccessfully', { title: title || t('certification.certificationTitlePlaceholder') }), color: 'success' });
  };

  return (
    <div className="flex flex-col gap-6">
      <StepHeader currentStep={1} onBack={onBack} />

      {/* Form card */}
      <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Certification Name — full width */}
          <div className="col-span-full">
            <Input
              label={t('certification.certificationTitle')}
              placeholder={t('certification.certificationTitlePlaceholder')}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              {...inputProperties.input}
            />
          </div>

          {/* Provider */}
          <Select
            label={t('certification.provider')}
            placeholder={t('certification.providerPlaceholder')}
            selectedKeys={provider ? [provider] : []}
            onSelectionChange={(keys) => onProviderChange(Array.from(keys)[0] as string ?? '')}
            {...inputProperties.select}
          >
            {PROVIDERS.map((p) => (
              <SelectItem key={p.key}>{t(p.labelKey)}</SelectItem>
            ))}
          </Select>

          {/* Exam Code */}
          <Input
            label={t('certification.certificationCode')}
            placeholder={t('certification.certificationCodePlaceholder')}
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            {...inputProperties.input}
          />

          {/* Tip box — full width */}
          <div className="col-span-full flex items-start gap-4 p-4 bg-background border border-default-200 rounded-xl">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faCircleInfo} className="text-primary text-base" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">{t('certification.tipTitle')}</span>
              <p className="text-xs text-default-500">{t('certification.tipDescription')}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-default-200">
          <Button
            variant="flat"
            className="bg-transparent text-default-400 hover:text-foreground text-xs font-semibold transition-colors"
            onPress={handleSaveDraft}
          >
            {t('certification.saveAsDraft')}
          </Button>
          <Button
            className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 flex items-center gap-2"
            onPress={handleNext}
          >
            {t('certification.nextDefineTopics')}
            <FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </div>
      </div>

      {/* Contextual helper cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-content1 border border-default-200 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold text-primary uppercase tracking-[0.2em]">{t('certification.validationLabel')}</span>
          <p className="text-xs text-default-500">{t('certification.validationDesc')}</p>
        </div>
        <div className="bg-content1 border border-default-200 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold text-secondary uppercase tracking-[0.2em]">{t('certification.automationLabel')}</span>
          <p className="text-xs text-default-500">{t('certification.automationDesc')}</p>
        </div>
        <div className="bg-content1 border border-default-200 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold text-warning uppercase tracking-[0.2em]">{t('certification.privacyLabel')}</span>
          <p className="text-xs text-default-500">{t('certification.privacyDesc')}</p>
        </div>
      </div> */}
    </div>
  );
}
