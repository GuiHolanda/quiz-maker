'use client';
import type { Exam, ExamSection } from '@/shared/types';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2DefineTopics } from './Step2DefineTopics';
import { Step3Review } from './Step3Review';

import { saveExam } from '@/features/connectors';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';

interface NewCertificationTabProps {
  readonly onSaved: () => void;
}

interface CertificationDraft {
  name: string;
  provider: string;
  totalQuestions: string;
  examDurationMinutes: string;
  passingScore: string;
  sections: ExamSection[];
  step: 1 | 2 | 3;
}

const STORAGE_KEY = 'NEW_CERTIFICATION_DRAFT';

const EMPTY_DRAFT: CertificationDraft = {
  name: '',
  provider: '',
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

function readDraft(): CertificationDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) return { ...EMPTY_DRAFT, ...JSON.parse(raw) };
  } catch {
    /* corrupted or unavailable storage */
  }

  return EMPTY_DRAFT;
}

export function NewCertificationTab({ onSaved }: NewCertificationTabProps) {
  const { certifications, addExam } = useExamsContext();
  const { loading, request } = useRequest(saveExam);
  const { t } = useTranslation();
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<CertificationDraft>(EMPTY_DRAFT);
  const prevStep = useRef<1 | 2 | 3>(1);

  useEffect(() => {
    setDraft(readDraft());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* storage full or unavailable */
    }
  }, [hydrated, draft]);

  const direction = draft.step > prevStep.current ? 1 : -1;

  const patch = (updates: Partial<CertificationDraft>) => setDraft((prev) => ({ ...prev, ...updates }));

  const goToStep = (next: 1 | 2 | 3) => {
    prevStep.current = draft.step;
    patch({ step: next });
  };

  const addEmptySection = () =>
    setDraft((prev) => ({ ...prev, sections: [...prev.sections, { name: '', minQuestions: 0, maxQuestions: 0 }] }));

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
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleSave = async () => {
    const name = draft.name.trim();

    if (!name) {
      notify.error(t('toast.validationError'), t('error.nameRequired'));
      return;
    }

    if (certifications.some((c) => c.name === name)) {
      notify.error(t('toast.duplicateCertification'), t('error.duplicateCode', { code: name }));
      return;
    }

    const exam: Exam = {
      type: 'certification',
      name,
      provider: draft.provider.trim() ? { name: draft.provider.trim() } : null,
      totalQuestions: parseInt(draft.totalQuestions, 10),
      examDurationMinutes: parseInt(draft.examDurationMinutes, 10) || null,
      passingScore: parseFloat(draft.passingScore) || null,
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
        examDurationMinutes={draft.examDurationMinutes}
        name={draft.name}
        passingScore={draft.passingScore}
        provider={draft.provider}
        totalQuestions={draft.totalQuestions}
        onBack={onSaved}
        onDiscard={() => setIsDiscardOpen(true)}
        onExamDurationMinutesChange={(v) => patch({ examDurationMinutes: v })}
        onNameChange={(v) => patch({ name: v })}
        onNext={() => goToStep(2)}
        onPassingScoreChange={(v) => patch({ passingScore: v })}
        onProviderChange={(v) => patch({ provider: v })}
        onTotalQuestionsChange={(v) => patch({ totalQuestions: v })}
      />
    ) : draft.step === 2 ? (
      <Step2DefineTopics
        name={draft.name}
        provider={draft.provider}
        sections={draft.sections}
        onAddEmptySection={addEmptySection}
        onBack={() => goToStep(1)}
        onDiscard={() => setIsDiscardOpen(true)}
        onNext={() => goToStep(3)}
        onRemoveSection={removeSection}
        onUpdateSection={updateSection}
      />
    ) : (
      <Step3Review
        examDurationMinutes={parseInt(draft.examDurationMinutes, 10) || undefined}
        isLoading={loading}
        name={draft.name}
        passingScore={parseFloat(draft.passingScore) || undefined}
        provider={draft.provider}
        sections={draft.sections}
        totalQuestions={parseInt(draft.totalQuestions, 10) || 0}
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
        body={<p className="text-sm text-default-500">{t('certification.discardDraftBody')}</p>}
        confirmLabel={t('certification.discardDraft')}
        confirmTestId="confirm-discard-btn"
        confirmVariant="danger"
        isOpen={isDiscardOpen}
        title={t('certification.discardDraftTitle')}
        onClose={() => setIsDiscardOpen(false)}
        onConfirm={handleConfirmDiscard}
      />
    </>
  );
}
