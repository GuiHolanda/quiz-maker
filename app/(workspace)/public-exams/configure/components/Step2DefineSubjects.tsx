'use client';
import type { PublicExamSubject } from '@/shared/types';

import { faCircleCheck, faCircleInfo, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { AnimatePresence, motion } from 'framer-motion';

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
  readonly onDiscard: () => void;
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
  onDiscard,
}: Step2DefineSubjectsProps) {
  const { t } = useTranslation();
  const totalWeightage = subjects.reduce((sum, subject) => sum + Number(subject.maxQuestions), 0);
  const isWeightageValid = totalWeightage === 100;
  const allSubjectsNamed = subjects.length > 0 && subjects.every((s) => s.name.trim().length > 0);
  const isMinMaxValid = subjects.every((s) => s.minQuestions <= s.maxQuestions);
  const hasDraft = !!(name || examBoardName || role || year || subjects.length > 0);

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

          <div
            className={`rounded-xl p-4 flex gap-3 transition-colors duration-300 ${
              isWeightageValid
                ? 'bg-success/10 border border-success/30'
                : 'bg-primary/10 border border-primary/30'
            }`}
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={isWeightageValid ? 'check' : 'info'}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                initial={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <FontAwesomeIcon
                  className={`mt-0.5 shrink-0 text-base ${isWeightageValid ? 'text-success' : 'text-primary'}`}
                  icon={isWeightageValid ? faCircleCheck : faCircleInfo}
                />
              </motion.span>
            </AnimatePresence>
            <div className="flex flex-col gap-1">
              <p className={`text-sm font-semibold transition-colors duration-300 ${isWeightageValid ? 'text-success' : 'text-primary'}`}>
                {t('concurso.systemLogic')}
              </p>
              <p className="text-sm text-default-500">
                {t('concurso.weightageInfoBase')}{' '}
                <motion.span
                  key={totalWeightage}
                  animate={{ scale: 1 }}
                  className={`font-bold inline-block ${isWeightageValid ? 'text-success' : 'text-warning'}`}
                  initial={{ scale: 1.25 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  {totalWeightage}%
                </motion.span>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-content1 border border-default-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-default-200">
            <h3 className="text-lg font-bold text-foreground">{t('concurso.subjectsTitle')}</h3>
            <Button
              className={buttonStyles.primarySm}
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
            <AnimatePresence initial={false}>
              {subjects.map((subject, index) => {
                const hasMinMaxError = subject.minQuestions > subject.maxQuestions;

                return (
                  <motion.div
                    key={index}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg flex flex-col gap-3 ${hasMinMaxError ? 'border border-danger/50 bg-danger/5 p-3' : 'bg-content1'}`}
                    exit={{ opacity: 0, y: -8 }}
                    initial={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-4 sm:items-end">
                      <Input
                        {...inputProperties.input}
                        label={t('concurso.subjectName')}
                        placeholder={t('concurso.subjectNamePlaceholder')}
                        value={subject.name}
                        onChange={(e) => onUpdateSubject(index, e.target.value, subject.minQuestions, subject.maxQuestions)}
                      />
                      <Input
                        {...inputProperties.input}
                        endContent={<span className="text-default-400 text-sm">%</span>}
                        label={t('concurso.minQuestions')}
                        max={100}
                        min={0}
                        type="number"
                        value={String(subject.minQuestions)}
                        onChange={(e) => {
                          const newMin = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          onUpdateSubject(index, subject.name, newMin, subject.maxQuestions);
                        }}
                      />
                      <Input
                        {...inputProperties.input}
                        endContent={<span className="text-default-400 text-sm">%</span>}
                        label={t('concurso.maxQuestions')}
                        max={100}
                        min={0}
                        type="number"
                        value={String(subject.maxQuestions)}
                        onChange={(e) => {
                          const newMax = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          onUpdateSubject(index, subject.name, subject.minQuestions, newMax);
                        }}
                      />
                      <div className="pb-1">
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
                    {hasMinMaxError && (
                      <p className="text-xs text-danger font-medium">{t('concurso.minGreaterThanMax')}</p>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-5 border-t border-default-200">
            {hasDraft && (
              <Button className={buttonStyles.dangerFlat} onPress={onDiscard}>
                {t('concurso.discardDraft')}
              </Button>
            )}
            <Button
              className={buttonStyles.primary}
              isDisabled={!allSubjectsNamed || !isWeightageValid || !isMinMaxValid}
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
