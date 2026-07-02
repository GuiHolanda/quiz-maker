'use client';
import type { PublicExamSubject } from '@/shared/types';

import { faCircleInfo, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';

import { StepHeader } from './StepHeader';

import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface Step2DefineSubjectsProps {
  readonly name: string;
  readonly role: string;
  readonly year: string;
  readonly examBoardName: string;
  readonly subjects: PublicExamSubject[];
  readonly onAddEmptySubject: () => void;
  readonly onUpdateSubject: (index: number, name: string, minQuestions: number, maxQuestions: number) => void;
  readonly onRemoveSubject: (index: number) => void;
  readonly onBack: () => void;
  readonly onNext: () => void;
  readonly onSaveDraft: () => void;
}

export function Step2DefineSubjects({
  name,
  role,
  year,
  examBoardName,
  subjects,
  onAddEmptySubject,
  onUpdateSubject,
  onRemoveSubject,
  onBack,
  onNext,
  onSaveDraft,
}: Step2DefineSubjectsProps) {
  const { t } = useTranslation();
  const totalWeightage = subjects.reduce((sum, subject) => sum + Number(subject.maxQuestions), 0);
  const isWeightageValid = totalWeightage === 100;
  const allSubjectsNamed = subjects.length > 0 && subjects.every((s) => s.name.trim().length > 0);

  return (
    <div className="flex flex-col gap-6">
      <StepHeader currentStep={2} onBack={onBack} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-foreground">{t('concurso.publicExamSummary')}</h3>
            <div className="grid grid-cols-4 gap-3 items-end">
              <div className="col-span-2 lg:col-span-4">
                <p className="text-xs font-bold text-primary-300">{t('concurso.nameLabel')}</p>
                <p className="text-base text-foreground mt-1">{name || '—'}</p>
              </div>
              <div className="col-span-1 lg:col-span-2">
                <p className="text-xs font-bold text-primary-300">{t('concurso.bancaLabel')}</p>
                <p className="text-sm text-foreground mt-1">{examBoardName || '—'}</p>
              </div>
              <div className="col-span-1 lg:col-span-2">
                <p className="text-xs font-bold text-primary-300">{t('concurso.cargoLabel')}</p>
                <p className="text-sm text-foreground mt-1">{role || '—'}</p>
              </div>
              <div className="col-span-1 lg:col-span-2">
                <p className="text-xs font-bold text-primary-300">{t('concurso.yearLabel')}</p>
                <p className="text-sm text-foreground mt-1">{year || '—'}</p>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex gap-3">
            <FontAwesomeIcon className="text-primary mt-0.5 shrink-0 text-base" icon={faCircleInfo} />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-extrabold text-primary">{t('concurso.systemLogic')}</p>
              <p className="text-sm text-default-500">
                {t('concurso.weightageInfoBase')}{' '}
                <span className={`font-bold ${isWeightageValid ? 'text-success' : 'text-warning'}`}>
                  {totalWeightage}%
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-content1 border border-default-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-default-200">
            <h3 className="text-lg font-bold text-foreground">{t('concurso.subjectsTitle')}</h3>
            <Button
              className="bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 h-8 px-4"
              size="sm"
              startContent={<FontAwesomeIcon className="text-[10px]" icon={faPlus} />}
              onPress={onAddEmptySubject}
            >
              {t('concurso.addSubject')}
            </Button>
          </div>

          <div className="flex flex-col gap-4 p-6 min-h-[200px]">
            {subjects.length === 0 && (
              <p className="text-sm text-default-400 text-center py-10">{t('concurso.noSubjects')}</p>
            )}
            {subjects.map((subject, index) => (
              <div key={index} className="bg-content1 rounded-lg flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="w-1/2">
                  <Input
                    {...inputProperties.input}
                    label={t('concurso.subjectName')}
                    placeholder={t('concurso.subjectNamePlaceholder')}
                    value={subject.name}
                    onChange={(e) => onUpdateSubject(index, e.target.value, subject.minQuestions, subject.maxQuestions)}
                  />
                </div>
                <div className="w-1/4 flex flex-col gap-1">
                  <Input
                    {...inputProperties.input}
                    endContent={<span className="text-default-400 text-sm">%</span>}
                    label={t('concurso.minQuestions')}
                    max={100}
                    min={0}
                    type="number"
                    value={String(subject.minQuestions)}
                    onChange={(e) =>
                      onUpdateSubject(
                        index,
                        subject.name,
                        Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                        subject.maxQuestions
                      )
                    }
                  />
                </div>
                <div className="w-1/4 flex flex-col gap-1">
                  <Input
                    {...inputProperties.input}
                    endContent={<span className="text-default-400 text-sm">%</span>}
                    label={t('concurso.maxQuestions')}
                    max={100}
                    min={0}
                    type="number"
                    value={String(subject.maxQuestions)}
                    onChange={(e) =>
                      onUpdateSubject(
                        index,
                        subject.name,
                        subject.minQuestions,
                        Math.min(100, Math.max(0, Number(e.target.value) || 0))
                      )
                    }
                  />
                </div>
                <div className="shrink-0 pb-1">
                  <Button
                    isIconOnly
                    aria-label={t('common.remove')}
                    className={buttonStyles.iconOnly.danger}
                    size="sm"
                    variant="light"
                    onPress={() => onRemoveSubject(index)}
                  >
                    <FontAwesomeIcon className="text-xs" icon={faTrash} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-5 border-t border-default-200">
            <Button
              className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 rounded-lg transition-colors duration-200 text-sm font-semibold"
              variant="flat"
              onPress={onSaveDraft}
            >
              {t('concurso.saveAsDraft')}
            </Button>
            <Button
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              isDisabled={!allSubjectsNamed || !isWeightageValid}
              onPress={onNext}
            >
              {t('concurso.finalizePublicExam')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
