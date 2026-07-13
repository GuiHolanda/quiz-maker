'use client';
import type { ExamBoard } from '@/shared/types';

import { useEffect, useState } from 'react';
import { faArrowRight, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';

import { StepHeader } from './StepHeader';

import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getExamBoards } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';

interface Step1BasicInfoProps {
  readonly name: string;
  readonly role: string;
  readonly year: string;
  readonly examBoardName: string;
  readonly onNameChange: (v: string) => void;
  readonly onRoleChange: (v: string) => void;
  readonly onYearChange: (v: string) => void;
  readonly onExamBoardChange: (v: string) => void;
  readonly onBack: () => void;
  readonly onNext: () => void;
}

export function Step1BasicInfo({
  name,
  role,
  year,
  examBoardName,
  onNameChange,
  onRoleChange,
  onYearChange,
  onExamBoardChange,
  onBack,
  onNext,
}: Step1BasicInfoProps) {
  const { t } = useTranslation();
  const [boards, setBoards] = useState<ExamBoard[]>([]);

  useEffect(() => {
    getExamBoards()
      .then(setBoards)
      .catch(() => {});
  }, []);

  const handleNext = () => {
    if (!name.trim() || !examBoardName.trim()) {
      notify.error(t('toast.validationError'), t('error.nameAndBancaRequired'));

      return;
    }
    onNext();
  };

  const handleSaveDraft = () => {
    notify.success(t('toast.success'), t('toast.savedSuccessfully', { title: name || t('concurso.namePlaceholder') }));
  };

  return (
    <div className="flex flex-col gap-6">
      <StepHeader currentStep={1} onBack={onBack} />

      <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full">
            <Input
              label={t('concurso.name')}
              placeholder={t('concurso.namePlaceholder')}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              {...inputProperties.input}
            />
          </div>

          <Autocomplete
            allowsCustomValue
            inputValue={examBoardName}
            label={t('concurso.banca')}
            placeholder={t('concurso.bancaPlaceholder')}
            onInputChange={onExamBoardChange}
            {...inputProperties.autocomplete}
          >
            {boards.map((b) => (
              <AutocompleteItem key={b.name}>{b.name}</AutocompleteItem>
            ))}
          </Autocomplete>

          <Input
            label={t('concurso.cargo')}
            placeholder={t('concurso.cargoPlaceholder')}
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            {...inputProperties.input}
          />

          <Input
            label={t('concurso.year')}
            placeholder={t('concurso.yearPlaceholder')}
            type="number"
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            {...inputProperties.input}
          />

          <div className="col-span-full flex items-start gap-4 p-4 bg-background border border-default-200 rounded-xl">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon className="text-primary text-base" icon={faCircleInfo} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">{t('concurso.tipTitle')}</span>
              <p className="text-xs text-default-500">{t('concurso.tipDescription')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-default-200">
          <Button
            className={buttonStyles.flat}
            variant="flat"
            onPress={handleSaveDraft}
          >
            {t('concurso.saveAsDraft')}
          </Button>
          <Button
            className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 flex items-center gap-2"
            onPress={handleNext}
          >
            {t('concurso.nextDefineSubjects')}
            <FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </div>
      </div>
    </div>
  );
}
