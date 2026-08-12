'use client';
import type { ExamBoard, ExamType, Provider } from '@/shared/types';

import { useEffect, useState } from 'react';
import { faArrowRight, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';

import { StepHeader } from '@/shared/components/ui/wizard/StepHeader';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { inputProperties } from '@/config/constants/inputStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getProviders, getExamBoards } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';

interface Step1BasicInfoProps {
  readonly type: ExamType;
  readonly name: string;
  readonly referenceEntityName: string;
  readonly role: string;
  readonly year: string;
  readonly examKey: string;
  readonly totalQuestions: string;
  readonly examDurationMinutes: string;
  readonly passingScore: string;
  readonly onNameChange: (v: string) => void;
  readonly onReferenceEntityNameChange: (v: string) => void;
  readonly onRoleChange: (v: string) => void;
  readonly onYearChange: (v: string) => void;
  readonly onExamKeyChange: (v: string) => void;
  readonly onTotalQuestionsChange: (v: string) => void;
  readonly onExamDurationMinutesChange: (v: string) => void;
  readonly onPassingScoreChange: (v: string) => void;
  readonly onBack: () => void;
  readonly onNext: () => void;
  readonly onDiscard: () => void;
}

export function Step1BasicInfo({
  type,
  name,
  referenceEntityName,
  role,
  year,
  examKey,
  totalQuestions,
  examDurationMinutes,
  passingScore,
  onNameChange,
  onReferenceEntityNameChange,
  onRoleChange,
  onYearChange,
  onExamKeyChange,
  onTotalQuestionsChange,
  onExamDurationMinutesChange,
  onPassingScoreChange,
  onBack,
  onNext,
  onDiscard,
}: Step1BasicInfoProps) {
  const { t } = useTranslation();
  const config = EXAM_CONFIG[type];
  const [referenceEntities, setReferenceEntities] = useState<Provider[] | ExamBoard[]>([]);

  const hasDraft = !!(name || referenceEntityName || role || year || totalQuestions);

  useEffect(() => {
    const fetcher = type === 'certification' ? getProviders : getExamBoards;
    fetcher()
      .then((items) => setReferenceEntities(items as Provider[] | ExamBoard[]))
      .catch(() => {});
  }, [type]);

  const handleNext = () => {
    if (!name.trim()) {
      notify.error(t('toast.validationError'), t('error.nameRequired'));
      return;
    }
    if (type === 'public_exam' && !referenceEntityName.trim()) {
      notify.error(t('toast.validationError'), t('error.nameAndBancaRequired'));
      return;
    }
    const parsedTotal = parseInt(totalQuestions, 10);
    if (!totalQuestions.trim() || isNaN(parsedTotal) || parsedTotal < 1) {
      notify.error(t('toast.validationError'), t('error.totalQuestionsRequired'));
      return;
    }
    if (!examKey.trim()) {
      notify.error(
        t('toast.validationError'),
        type === 'certification' ? t('error.keyRequired') : t('error.editalKeyRequired')
      );
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
        <StepHeader
          currentStep={1}
          namespace={type === 'certification' ? 'certification' : 'concurso'}
          onBack={onBack}
        />
        <div className="flex flex-col gap-6">
          <div className="flex gap-4 flex-wrap">
            <Input
              data-testid="wizard-title-input"
              label={t(type === 'certification' ? 'certification.certificationTitle' : 'concurso.name')}
              placeholder={t(
                type === 'certification' ? 'certification.certificationTitlePlaceholder' : 'concurso.namePlaceholder'
              )}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              {...inputProperties.input}
              className={`w-full ${config.hasRoleField ? 'lg:w-2/5' : 'lg:w-4/6'}`}
            />
            <Autocomplete
              allowsCustomValue
              data-testid={type === 'certification' ? 'exam-provider-input' : 'exam-examboard-input'}
              inputValue={referenceEntityName}
              label={t(type === 'certification' ? 'exam.providerLabel' : 'exam.examBoardLabel')}
              placeholder={t(
                type === 'certification' ? 'certification.providerPlaceholder' : 'concurso.bancaPlaceholder'
              )}
              onInputChange={onReferenceEntityNameChange}
              {...inputProperties.autocomplete}
              className="w-2/5 lg:w-1/5"
            >
              {referenceEntities.map((entity) => (
                <AutocompleteItem key={entity.name}>{entity.name}</AutocompleteItem>
              ))}
            </Autocomplete>
            <Input
              isRequired
              data-testid="wizard-key-input"
              label={t(type === 'certification' ? 'exam.keyLabel' : 'exam.editalKeyLabel')}
              placeholder={t(type === 'certification' ? 'exam.certKeyPlaceholder' : 'exam.editalKeyPlaceholder')}
              value={examKey}
              onChange={(e) => onExamKeyChange(e.target.value)}
              {...inputProperties.input}
              className="w-2/5 lg:w-1/5"
            />
            {config.hasRoleField && (
              <Input
                label={t('concurso.cargo')}
                placeholder={t('concurso.cargoPlaceholder')}
                value={role}
                onChange={(e) => onRoleChange(e.target.value)}
                {...inputProperties.input}
                className="w-2/5 lg:w-1/5"
              />
            )}
          </div>

          <div className="flex gap-4">
            <Input
              isRequired
              label={t('certification.totalQuestions')}
              min={1}
              placeholder={type === 'certification' ? 'e.g. 65' : 'e.g. 80'}
              type="number"
              value={totalQuestions}
              onChange={(e) => onTotalQuestionsChange(e.target.value)}
              {...inputProperties.input}
              className="w-1/4 lg:w-1/6"
            />
            <Input
              endContent={
                <span className="text-xs text-default-400 self-center">{t('certification.examDurationUnit')}</span>
              }
              label={t('certification.examDuration')}
              min={1}
              placeholder={type === 'certification' ? 'e.g. 130' : 'e.g. 240'}
              type="number"
              value={examDurationMinutes}
              onChange={(e) => onExamDurationMinutesChange(e.target.value)}
              {...inputProperties.input}
              className="w-1/4 lg:w-1/6"
            />
            <Input
              endContent={<span className="text-xs text-default-400 self-center">%</span>}
              label={t('certification.passingScore')}
              max={100}
              min={0}
              placeholder={type === 'certification' ? 'e.g. 72' : 'e.g. 70'}
              type="number"
              value={passingScore}
              onChange={(e) => onPassingScoreChange(e.target.value)}
              {...inputProperties.input}
              className="w-1/4 lg:w-1/6"
            />
            {config.hasYearField && (
              <Input
                label={t('concurso.year')}
                placeholder={t('concurso.yearPlaceholder')}
                type="number"
                value={year}
                onChange={(e) => onYearChange(e.target.value)}
                {...inputProperties.input}
                className="w-1/4 lg:w-1/6"
              />
            )}
          </div>

          <div className="col-span-full flex items-start gap-4 p-4 bg-background border border-default-200 rounded-xl">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon className="text-primary text-base" icon={faCircleInfo} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {t(type === 'certification' ? 'certification.tipTitle' : 'concurso.tipTitle')}
              </span>
              <p className="text-xs text-default-500">
                {t(type === 'certification' ? 'certification.tipDescription' : 'concurso.tipDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-default-200">
          {hasDraft && (
            <Button data-testid="wizard-discard-btn" className={buttonStyles.dangerFlat} onPress={onDiscard}>
              {t(config.discardDraftLabel)}
            </Button>
          )}
          <Button
            data-testid="wizard-next-btn"
            className={buttonStyles.primary}
            endContent={<FontAwesomeIcon icon={faArrowRight} />}
            onPress={handleNext}
            size="sm"
          >
            {t(config.nextStepLabel)}
          </Button>
        </div>
      </div>
    </div>
  );
}
