'use client';
import type { CertificationTopic } from '@/shared/types';

import { faCircleInfo, faLayerGroup, faRocket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { motion } from 'framer-motion';

import { StepHeader } from './StepHeader';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface Step3ReviewProps {
  readonly title: string;
  readonly code: string;
  readonly provider: string;
  readonly totalQuestions: number;
  readonly examDurationMinutes?: number;
  readonly passingScore?: number;
  readonly topics: CertificationTopic[];
  readonly isLoading: boolean;
  readonly onBack: () => void;
  readonly onSave: () => void;
  readonly onDiscard: () => void;
}

export function Step3Review({ title, code, provider, totalQuestions, examDurationMinutes, passingScore, topics, isLoading, onBack, onSave, onDiscard }: Step3ReviewProps) {
  const { t } = useTranslation();
  const hasDraft = !!(title || code || provider || topics.length > 0);
  const visibleTopics = topics.filter((topic) => topic.name && topic.maxQuestions);

  return (
    <div className="flex flex-col gap-6">
      <StepHeader currentStep={3} onBack={onBack} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-content1 border border-default-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-default-200">
            <FontAwesomeIcon className="text-primary text-base" icon={faCircleInfo} />
            <h3 className="text-lg font-semibold text-foreground">{t('certification.basicInformation')}</h3>
          </div>
          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-default-400">{t('certification.certNameLabel')}</p>
              <p className="text-base font-semibold text-foreground">{title || '—'}</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-default-400">{t('certification.providerLabel')}</p>
              <p className="text-base text-foreground">{provider || '—'}</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-default-400">{t('certification.examCodeLabel')}</p>
              <span className="inline-flex w-fit bg-content2 border border-default-200 rounded px-3 py-1 font-mono text-primary text-sm">
                {code || '—'}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-default-400">{t('certification.totalQuestions')}</p>
              <p className="text-base text-foreground">{totalQuestions}</p>
            </div>
            {examDurationMinutes && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-default-400">{t('certification.examDuration')}</p>
                <p className="text-base text-foreground">{examDurationMinutes} {t('certification.examDurationUnit')}</p>
              </div>
            )}
            {passingScore !== undefined && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-default-400">{t('certification.passingScore')}</p>
                <p className="text-base text-foreground">{passingScore}%</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-content1 border border-default-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-default-200">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon className="text-primary text-base" icon={faLayerGroup} />
              <h3 className="text-lg font-semibold text-foreground">{t('certification.studyDomains')}</h3>
            </div>
            <span className="text-xs font-medium text-default-400">
              {t('certification.domainsCount', {
                count: String(visibleTopics.length),
              })}
            </span>
          </div>
          <div className="flex flex-col p-6 gap-6">
            {visibleTopics.length === 0 && (
              <p className="text-sm text-default-400 text-center py-4">{t('certification.noTopics')}</p>
            )}
            {visibleTopics.map((topic, index) => (
              <motion.div
                key={topic.name + index}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-2"
                initial={{ opacity: 0, x: -12 }}
                transition={{ delay: index * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{topic.name}</p>
                  <p className="text-sm font-bold font-mono text-primary">{topic.maxQuestions}%</p>
                </div>
                <div className="w-full h-2 bg-content2 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${topic.minQuestions}%` }}
                    className="h-full bg-primary rounded-full"
                    initial={{ width: '0%' }}
                    transition={{ delay: index * 0.06 + 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </motion.div>
            ))}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
              <FontAwesomeIcon className="text-primary mt-0.5 shrink-0 text-sm" icon={faCircleInfo} />
              <p className="text-sm text-default-500">{t('certification.studyPathNote')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-6 border-t border-default-200">
        {hasDraft && (
          <Button className={buttonStyles.dangerFlat} isDisabled={isLoading} onPress={onDiscard}>
            {t('certification.discardDraft')}
          </Button>
        )}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <p className="text-xs text-default-400 text-center sm:text-left">{t('certification.readyToDeploy')}</p>
          <Button
            className={buttonStyles.primary}
            endContent={!isLoading ? <FontAwesomeIcon className="text-xs" icon={faRocket} /> : undefined}
            isDisabled={isLoading}
            isLoading={isLoading}
            onPress={onSave}
          >
            {t('certification.finalizeAndCreate')}
          </Button>
        </div>
      </div>
    </div>
  );
}
