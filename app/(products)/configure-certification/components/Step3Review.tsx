'use client';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { CertificationTopic } from '@/shared/types';
import { SectionsTable } from '@/shared/components/SectionsTable';
import { StepProgress } from './StepProgress';

interface Step3ReviewProps {
  readonly title: string;
  readonly code: string;
  readonly provider: string;
  readonly topics: CertificationTopic[];
  readonly isLoading: boolean;
  readonly onBack: () => void;
  readonly onSave: () => void;
}

export function Step3Review({ title, code, provider, topics, isLoading, onBack, onSave }: Step3ReviewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <StepProgress currentStep={3} />

      <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
        <h3 className="text-xl font-bold text-foreground">{t('certification.reviewCertification')}</h3>

        {/* Certification info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">{t('certification.certificationTitle')}</span>
            <span className="text-sm font-semibold text-foreground">{title}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">{t('certification.certificationCode')}</span>
            <span className="text-sm font-semibold text-foreground">{code}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">{t('certification.provider')}</span>
            <span className="text-sm font-semibold text-foreground">{provider || '—'}</span>
          </div>
        </div>

        {/* Topics */}
        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            {t('certification.reviewTopics', { count: String(topics.length) })}
          </span>
          <SectionsTable selectedCertification={null} topicsList={topics} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-default-200">
          <Button
            variant="bordered"
            className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold transition-colors duration-200 flex items-center gap-2"
            onPress={onBack}
            isDisabled={isLoading}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            {t('common.back')}
          </Button>
          <Button
            className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
            onPress={onSave}
            isLoading={isLoading}
            isDisabled={isLoading}
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
