'use client';
import type { Exam, ExamSection } from '@/shared/types';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';

import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2DefineSubjects } from './Step2DefineSubjects';
import { Step3Review } from './Step3Review';

import { saveExam } from '@/features/connectors';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface NewPublicExamTabProps {
  readonly onBackToLibrary: () => void;
}

interface PublicExamDraft {
  name: string;
  role: string;
  year: string;
  examBoardName: string;
  totalQuestions: string;
  examDurationMinutes: string;
  passingScore: string;
  sections: ExamSection[];
  step: 1 | 2 | 3;
}

const STORAGE_KEY = 'NEW_PUBLIC_EXAM_DRAFT';

const EMPTY_DRAFT: PublicExamDraft = {
  name: '',
  role: '',
  year: '',
  examBoardName: '',
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

function readDraft(): PublicExamDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) return { ...EMPTY_DRAFT, ...JSON.parse(raw) };
  } catch {
    /* corrupted or unavailable storage */
  }

  return EMPTY_DRAFT;
}

export function NewPublicExamTab({ onBackToLibrary }: NewPublicExamTabProps) {
  const { publicExams, addExam } = useExamsContext();
  const { loading, request } = useRequest(saveExam);
  const { t } = useTranslation();
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<PublicExamDraft>(EMPTY_DRAFT);
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

  const patch = (updates: Partial<PublicExamDraft>) => setDraft((prev) => ({ ...prev, ...updates }));

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
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleSave = async () => {
    const name = draft.name.trim();
    const examBoardName = draft.examBoardName.trim();

    if (!name || !examBoardName) {
      notify.error(t('toast.validationError'), t('error.nameAndBancaRequired'));
      return;
    }

    const yearNum = draft.year ? Number(draft.year) : undefined;

    if (publicExams.some((p) => p.name === name && (p.year ?? undefined) === yearNum)) {
      notify.error(t('toast.duplicatePublicExam'), t('error.duplicatePublicExam', { name }));
      return;
    }

    const exam: Exam = {
      type: 'public_exam',
      name,
      role: draft.role.trim() || null,
      year: yearNum ?? null,
      totalQuestions: parseInt(draft.totalQuestions, 10),
      examDurationMinutes: parseInt(draft.examDurationMinutes, 10) || null,
      passingScore: parseFloat(draft.passingScore) || null,
      examBoard: { name: examBoardName },
      sections: draft.sections,
    };

    const saved = await request(exam);

    if (saved) {
      addExam(saved);
      resetDraft();
      notify.success(t('toast.success'), t('toast.savedSuccessfully', { title: name }));
      onBackToLibrary();
    }
  };

  const handleConfirmDiscard = () => {
    resetDraft();
    setIsDiscardOpen(false);
    onBackToLibrary();
  };

  const stepContent =
    draft.step === 1 ? (
      <Step1BasicInfo
        examBoardName={draft.examBoardName}
        examDurationMinutes={draft.examDurationMinutes}
        name={draft.name}
        passingScore={draft.passingScore}
        role={draft.role}
        totalQuestions={draft.totalQuestions}
        year={draft.year}
        onBack={onBackToLibrary}
        onDiscard={() => setIsDiscardOpen(true)}
        onExamBoardChange={(v) => patch({ examBoardName: v })}
        onExamDurationMinutesChange={(v) => patch({ examDurationMinutes: v })}
        onNameChange={(v) => patch({ name: v })}
        onNext={() => goToStep(2)}
        onPassingScoreChange={(v) => patch({ passingScore: v })}
        onRoleChange={(v) => patch({ role: v })}
        onTotalQuestionsChange={(v) => patch({ totalQuestions: v })}
        onYearChange={(v) => patch({ year: v })}
      />
    ) : draft.step === 2 ? (
      <Step2DefineSubjects
        examBoardName={draft.examBoardName}
        name={draft.name}
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
        examBoardName={draft.examBoardName}
        examDurationMinutes={parseInt(draft.examDurationMinutes, 10) || undefined}
        isLoading={loading}
        name={draft.name}
        passingScore={parseFloat(draft.passingScore) || undefined}
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

      <Modal isOpen={isDiscardOpen} size="sm" onClose={() => setIsDiscardOpen(false)}>
        <ModalContent>
          <ModalHeader>{t('concurso.discardDraftTitle')}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">{t('concurso.discardDraftBody')}</p>
          </ModalBody>
          <ModalFooter>
            <Button className={buttonStyles.secondary} variant="bordered" onPress={() => setIsDiscardOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button data-testid="confirm-discard-btn" className={buttonStyles.danger} onPress={handleConfirmDiscard}>
              {t('concurso.discardDraft')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
