'use client';
import { faArrowLeft, faCircleInfo, faLayerGroup, faRocket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { CertificationTopic } from '@/shared/types';

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
      <div className="flex flex-col">
        <h1 className="page-header-title">{t('certification.createNewTitle')}</h1>
        <p className="page-header-subtitle mt-1">{t('certification.step3Description')}</p>
      </div>
      <StepProgress currentStep={3} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-content1 border border-default-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-default-200">
            <FontAwesomeIcon icon={faCircleInfo} className="text-primary text-base" />
            <h3 className="text-lg font-semibold text-foreground">{t('certification.basicInformation')}</h3>
          </div>
          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium  text-default-400">
                {t('certification.certNameLabel')}
              </p>
              <p className="text-base font-semibold text-foreground">{title || '—'}</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium  text-default-400">
                {t('certification.providerLabel')}
              </p>
              <p className="text-base text-foreground">{provider || '—'}</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium  text-default-400">
                {t('certification.examCodeLabel')}
              </p>
              <span className="inline-flex w-fit bg-default-100 border border-default-200 rounded px-3 py-1 font-mono text-primary text-sm">
                {code || '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-content1 border border-default-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-default-200">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faLayerGroup} className="text-primary text-base" />
              <h3 className="text-lg font-semibold text-foreground">{t('certification.studyDomains')}</h3>
            </div>
            <span className="text-xs font-medium text-default-400 ">
              {t('certification.domainsCount', { count: String(topics.length) })}
            </span>
          </div>
          <div className="flex flex-col p-6 gap-6">
            {topics.length === 0 && (
              <p className="text-sm text-default-400 text-center py-4">{t('certification.noTopics')}</p>
            )}
            {topics.map((topic, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{topic.name}</p>
                  <p className="text-sm font-bold font-mono text-primary">{topic.minQuestions}%</p>
                </div>
                <div className="w-full h-2 bg-default-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${topic.minQuestions}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
              <FontAwesomeIcon icon={faCircleInfo} className="text-primary mt-0.5 shrink-0 text-sm" />
              <p className="text-sm text-default-500">{t('certification.studyPathNote')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-default-200">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2 text-sm text-default-500 hover:text-foreground transition-colors duration-200 w-fit"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          {t('certification.backToStep2')}
        </button>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <p className="text-xs text-default-400 text-center sm:text-left">
            {t('certification.readyToDeploy')}
          </p>
          <Button
            className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
            onPress={onSave}
            isLoading={isLoading}
            isDisabled={isLoading}
            endContent={!isLoading ? <FontAwesomeIcon icon={faRocket} className="text-xs" /> : undefined}
          >
            {t('certification.finalizeAndCreate')}
          </Button>
        </div>
      </div>
    </div>
  );
}
