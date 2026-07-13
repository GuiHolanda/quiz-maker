'use client';
import type { PublicExamSubject } from '@/shared/types';

import { faCircleInfo, faLayerGroup, faRocket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';

import { StepHeader } from './StepHeader';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface Step3ReviewProps {
  readonly name: string;
  readonly role: string;
  readonly year: string;
  readonly examBoardName: string;
  readonly subjects: PublicExamSubject[];
  readonly isLoading: boolean;
  readonly onBack: () => void;
  readonly onSave: () => void;
  readonly onDiscard: () => void;
}

export function Step3Review({
  name,
  role,
  year,
  examBoardName,
  subjects,
  isLoading,
  onBack,
  onSave,
  onDiscard,
}: Step3ReviewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <StepHeader currentStep={3} onBack={onBack} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-content1 border border-default-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-default-200">
            <FontAwesomeIcon className="text-primary text-base" icon={faCircleInfo} />
            <h3 className="text-lg font-semibold text-foreground">{t('concurso.basicInformation')}</h3>
          </div>
          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-default-400">{t('concurso.nameLabel')}</p>
              <p className="text-base font-semibold text-foreground">{name || '—'}</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-default-400">{t('concurso.bancaLabel')}</p>
              <p className="text-base text-foreground">{examBoardName || '—'}</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-default-400">{t('concurso.cargoLabel')}</p>
              <p className="text-base text-foreground">{role || '—'}</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-default-400">{t('concurso.yearLabel')}</p>
              <span className="inline-flex w-fit bg-default-100 border border-default-200 rounded px-3 py-1 font-mono text-primary text-sm">
                {year || '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-content1 border border-default-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-default-200">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon className="text-primary text-base" icon={faLayerGroup} />
              <h3 className="text-lg font-semibold text-foreground">{t('concurso.subjectsTitle')}</h3>
            </div>
            <span className="text-xs font-medium text-default-400">
              {t('concurso.subjectsCount', {
                count: String(subjects.filter((s) => s.name && s.minQuestions).length),
              })}
            </span>
          </div>
          <div className="flex flex-col p-6 gap-6">
            {subjects.filter((s) => s.name && s.maxQuestions).length === 0 && (
              <p className="text-sm text-default-400 text-center py-4">{t('concurso.noSubjects')}</p>
            )}
            {subjects
              .filter((s) => s.name && s.maxQuestions)
              .map((subject, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{subject.name}</p>
                    <p className="text-sm font-bold font-mono text-primary">{subject.maxQuestions}%</p>
                  </div>
                  <div className="w-full h-2 bg-default-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${subject.minQuestions}%` }}
                    />
                  </div>
                </div>
              ))}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
              <FontAwesomeIcon className="text-primary mt-0.5 shrink-0 text-sm" icon={faCircleInfo} />
              <p className="text-sm text-default-500">{t('concurso.studyPathNote')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-6 border-t border-default-200">
        <Button className={buttonStyles.dangerFlat} isDisabled={isLoading} onPress={onDiscard}>
          {t('concurso.discardDraft')}
        </Button>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <p className="text-xs text-default-400 text-center sm:text-left">{t('concurso.readyToDeploy')}</p>
          <Button
            className={buttonStyles.primary}
            endContent={!isLoading ? <FontAwesomeIcon className="text-xs" icon={faRocket} /> : undefined}
            isDisabled={isLoading}
            isLoading={isLoading}
            onPress={onSave}
          >
            {t('concurso.finalizeAndCreate')}
          </Button>
        </div>
      </div>
    </div>
  );
}
