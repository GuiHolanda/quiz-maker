'use client';
import type { Exam, ExamSection, ExamType } from '@/shared/types';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2DefineSections } from './Step2DefineSections';
import { Step3Review } from './Step3Review';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';

import { saveExam } from '@/features/connectors';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';

interface ExamWizardProps {
  readonly type: ExamType;
  readonly onSaved: () => void;
  readonly onBack?: () => void;
}

interface ExamDraft {
  name: string;
  referenceEntityName: string;
  role: string;
  year: string;
  totalQuestions: string;
  examDurationMinutes: string;
  passingScore: string;
  sections: ExamSection[];
  step: 1 | 2 | 3;
}

const EMPTY_DRAFT: ExamDraft = {
  name: '',
  referenceEntityName: '',
  role: '',
  year: '',
  totalQuestions: '',
  examDurationMinutes: '',
  passingScore: '',
  sections: [],
  step: 1,
};

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

function readDraft(storageKey: string): ExamDraft {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return { ...EMPTY_DRAFT, ...JSON.parse(raw) };
  } catch {
    /* corrupted or unavailable storage */
  }
  return EMPTY_DRAFT;
}

export function ExamWizard({ type, onSaved, onBack }: ExamWizardProps) {
  const config = EXAM_CONFIG[type];
  const { certifications, publicExams, addExam } = useExamsContext();
  const { loading, request } = useRequest(saveExam);
  const { t } = useTranslation();
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<ExamDraft>(EMPTY_DRAFT);
  const prevStep = useRef<1 | 2 | 3>(1);

  useEffect(() => {
    setDraft(readDraft(config.draftStorageKey));
    setHydrated(true);
  }, [config.draftStorageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(config.draftStorageKey, JSON.stringify(draft));
    } catch {
      /* storage full or unavailable */
    }
  }, [hydrated, draft, config.draftStorageKey]);

  const direction = draft.step > prevStep.current ? 1 : -1;
  const patch = (updates: Partial<ExamDraft>) => setDraft((prev) => ({ ...prev, ...updates }));

  const goToStep = (next: 1 | 2 | 3) => {
    prevStep.current = draft.step;
    patch({ step: next });
  };

  const addEmptySection = () =>
    setDraft((prev) => ({
      ...prev,
      sections: [...prev.sections, { name: '', minQuestions: 0, maxQuestions: 0, topics: [] }],
    }));

  const updateSection = (index: number, name: string, minQuestions: number, maxQuestions: number) =>
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === index ? { ...s, name, minQuestions, maxQuestions } : s)),
    }));

  const removeSection = (index: number) =>
    setDraft((prev) => ({ ...prev, sections: prev.sections.filter((_, i) => i !== index) }));

  const resetDraft = () => {
    prevStep.current = 1;
    setDraft(EMPTY_DRAFT);
    try {
      localStorage.removeItem(config.draftStorageKey);
    } catch {
      /* ignore */
    }
  };

  const handleSave = async () => {
    const name = draft.name.trim();
    const referenceEntityName = draft.referenceEntityName.trim();

    if (!name) {
      notify.error(t('toast.validationError'), t('error.nameRequired'));
      return;
    }
    if (type === 'public_exam' && !referenceEntityName) {
      notify.error(t('toast.validationError'), t('error.nameAndBancaRequired'));
      return;
    }

    const exams = type === 'certification' ? certifications : publicExams;
    const yearNum = draft.year ? Number(draft.year) : undefined;

    const isDuplicate =
      type === 'certification'
        ? exams.some((e) => e.name === name)
        : exams.some((e) => e.name === name && (e.year ?? undefined) === yearNum);

    if (isDuplicate) {
      const toastKey = type === 'certification' ? 'toast.duplicateCertification' : 'toast.duplicatePublicExam';
      const msgKey = type === 'certification' ? 'error.duplicateCode' : 'error.duplicatePublicExam';
      notify.error(t(toastKey), t(msgKey, { code: name, name }));
      return;
    }

    const totalQuestions = parseInt(draft.totalQuestions, 10);
    const examDurationMinutes = parseInt(draft.examDurationMinutes, 10) || null;
    const passingScore = parseFloat(draft.passingScore) || null;

    const exam: Exam =
      type === 'certification'
        ? {
            type: 'certification',
            name,
            provider: referenceEntityName ? { name: referenceEntityName } : null,
            totalQuestions,
            examDurationMinutes,
            passingScore,
            sections: draft.sections,
          }
        : {
            type: 'public_exam',
            name,
            role: draft.role.trim() || null,
            year: yearNum ?? null,
            totalQuestions,
            examDurationMinutes,
            passingScore,
            examBoard: { name: referenceEntityName },
            sections: draft.sections,
          };

    const saved = await request(exam);
    if (saved) {
      addExam(saved);
      resetDraft();
      notify.success(t('toast.success'), t('toast.savedSuccessfully', { title: name }));
      onSaved();
    }
  };

  const handleConfirmDiscard = () => {
    resetDraft();
    setIsDiscardOpen(false);
    onSaved();
  };

  const stepContent =
    draft.step === 1 ? (
      <Step1BasicInfo
        type={type}
        examDurationMinutes={draft.examDurationMinutes}
        name={draft.name}
        passingScore={draft.passingScore}
        referenceEntityName={draft.referenceEntityName}
        role={draft.role}
        totalQuestions={draft.totalQuestions}
        year={draft.year}
        onBack={onBack ?? onSaved}
        onDiscard={() => setIsDiscardOpen(true)}
        onExamDurationMinutesChange={(v) => patch({ examDurationMinutes: v })}
        onNameChange={(v) => patch({ name: v })}
        onNext={() => goToStep(2)}
        onPassingScoreChange={(v) => patch({ passingScore: v })}
        onReferenceEntityNameChange={(v) => patch({ referenceEntityName: v })}
        onRoleChange={(v) => patch({ role: v })}
        onTotalQuestionsChange={(v) => patch({ totalQuestions: v })}
        onYearChange={(v) => patch({ year: v })}
      />
    ) : draft.step === 2 ? (
      <Step2DefineSections
        type={type}
        name={draft.name}
        referenceEntityName={draft.referenceEntityName}
        role={draft.role}
        sections={draft.sections}
        year={draft.year}
        onAddEmptySection={addEmptySection}
        onBack={() => goToStep(1)}
        onDiscard={() => setIsDiscardOpen(true)}
        onNext={() => goToStep(3)}
        onRemoveSection={removeSection}
        onUpdateSection={updateSection}
      />
    ) : (
      <Step3Review
        type={type}
        examDurationMinutes={parseInt(draft.examDurationMinutes, 10) || undefined}
        isLoading={loading}
        name={draft.name}
        passingScore={parseFloat(draft.passingScore) || undefined}
        referenceEntityName={draft.referenceEntityName}
        role={draft.role}
        sections={draft.sections}
        totalQuestions={parseInt(draft.totalQuestions, 10) || 0}
        year={draft.year}
        onBack={() => goToStep(2)}
        onDiscard={() => setIsDiscardOpen(true)}
        onSave={handleSave}
      />
    );

  return (
    <>
      <div className="overflow-hidden">
        <AnimatePresence custom={direction} initial={false} mode="wait">
          <motion.div
            key={draft.step}
            animate="center"
            custom={direction}
            exit="exit"
            initial="enter"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            variants={variants}
          >
            {stepContent}
          </motion.div>
        </AnimatePresence>
      </div>

      <ConfirmModal
        body={<p className="text-sm text-default-500">{t(config.discardDraftBody)}</p>}
        confirmLabel={t(config.discardDraftLabel)}
        confirmTestId="confirm-discard-btn"
        confirmVariant="danger"
        isOpen={isDiscardOpen}
        title={t(config.discardDraftTitle)}
        onClose={() => setIsDiscardOpen(false)}
        onConfirm={handleConfirmDiscard}
      />
    </>
  );
}
