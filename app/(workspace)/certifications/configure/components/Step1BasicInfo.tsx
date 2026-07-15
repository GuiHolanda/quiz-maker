'use client';
import { faArrowRight, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';

import { StepHeader } from './StepHeader';

import { buttonStyles } from '@/config/constants/buttonStyles';
import { inputProperties } from '@/config/constants/inputStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

interface Step1BasicInfoProps {
  readonly title: string;
  readonly code: string;
  readonly provider: string;
  readonly onTitleChange: (v: string) => void;
  readonly onCodeChange: (v: string) => void;
  readonly onProviderChange: (v: string) => void;
  readonly onBack: () => void;
  readonly onNext: () => void;
  readonly onDiscard: () => void;
}

export function Step1BasicInfo({
  title,
  code,
  provider,
  onTitleChange,
  onCodeChange,
  onProviderChange,
  onBack,
  onNext,
  onDiscard,
}: Step1BasicInfoProps) {
  const { t } = useTranslation();
  const hasDraft = !!(title || code || provider);

  const handleNext = () => {
    if (!title.trim() || !code.trim()) {
      notify.error(t('toast.validationError'), t('error.titleCodeRequired'));

      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col gap-6">
      <StepHeader currentStep={1} onBack={onBack} />

      <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full">
            <Input
              label={t('certification.certificationTitle')}
              placeholder={t('certification.certificationTitlePlaceholder')}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              {...inputProperties.input}
            />
          </div>

          <Input
            label={t('certification.provider')}
            placeholder={t('certification.providerPlaceholder')}
            value={provider}
            onChange={(e) => onProviderChange(e.target.value)}
            {...inputProperties.input}
          />

          <Input
            label={t('certification.certificationCode')}
            placeholder={t('certification.certificationCodePlaceholder')}
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            {...inputProperties.input}
          />

          <div className="col-span-full flex items-start gap-4 p-4 bg-background border border-default-200 rounded-xl">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon className="text-primary text-base" icon={faCircleInfo} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">{t('certification.tipTitle')}</span>
              <p className="text-xs text-default-500">{t('certification.tipDescription')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-default-200">
          {hasDraft && (
            <Button className={buttonStyles.dangerFlat} onPress={onDiscard}>
              {t('certification.discardDraft')}
            </Button>
          )}
          <Button
            className={buttonStyles.primary}
            endContent={<FontAwesomeIcon icon={faArrowRight} />}
            onPress={handleNext}
          >
            {t('certification.nextDefineTopics')}
          </Button>
        </div>
      </div>
    </div>
  );
}
