'use client';
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';

import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2DefineSubjects } from './Step2DefineSubjects';
import { Step3Review } from './Step3Review';

import { savePublicExam } from '@/features/connectors';
import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { usePublicExamDraft } from '@/features/hooks/usePublicExamDraft.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface NewPublicExamTabProps {
  readonly onBackToLibrary: () => void;
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function NewPublicExamTab({ onBackToLibrary }: NewPublicExamTabProps) {
  const { addPublicExam, publicExams } = usePublicExamsContext();
  const { loading, request } = useRequest(savePublicExam);
  const draft = usePublicExamDraft();
  const { t } = useTranslation();
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const prevStep = useRef(draft.step);

  const direction = draft.step > prevStep.current ? 1 : -1;

  const goToStep = (next: 1 | 2 | 3) => {
    prevStep.current = draft.step;
    draft.setStep(next);
  };

  const handleSave = async () => {
    const name = draft.name.trim();
    const examBoardName = draft.examBoardName.trim();

    if (!name || !examBoardName) {
      notify.error(t('toast.validationError'), t('error.nameAndBancaRequired'));
      return;
    }

    const yearNum = draft.year ? Number(draft.year) : undefined;

    if (publicExams.some((p) => p.name === name && p.year === yearNum)) {
      notify.error(t('toast.duplicatePublicExam'), t('error.duplicatePublicExam', { name }));
      return;
    }

    const publicExam = {
      name,
      role: draft.role.trim() || undefined,
      year: yearNum,
      examBoard: { name: examBoardName },
      subjects: draft.subjects,
    };

    const saved = await request(publicExam);

    if (saved) {
      addPublicExam(saved);
      draft.reset();
      notify.success(t('toast.success'), t('toast.savedSuccessfully', { title: name }));
      onBackToLibrary();
    }
  };

  const handleConfirmDiscard = () => {
    draft.reset();
    setIsDiscardOpen(false);
    onBackToLibrary();
  };

  const stepContent =
    draft.step === 1 ? (
      <Step1BasicInfo
        examBoardName={draft.examBoardName}
        name={draft.name}
        role={draft.role}
        year={draft.year}
        onBack={onBackToLibrary}
        onDiscard={() => setIsDiscardOpen(true)}
        onExamBoardChange={draft.setExamBoardName}
        onNameChange={draft.setName}
        onNext={() => goToStep(2)}
        onRoleChange={draft.setRole}
        onYearChange={draft.setYear}
      />
    ) : draft.step === 2 ? (
      <Step2DefineSubjects
        examBoardName={draft.examBoardName}
        name={draft.name}
        role={draft.role}
        subjects={draft.subjects}
        year={draft.year}
        onAddEmptySubject={draft.addEmptySubject}
        onBack={() => goToStep(1)}
        onDiscard={() => setIsDiscardOpen(true)}
        onNext={() => goToStep(3)}
        onRemoveSubject={draft.removeSubject}
        onUpdateSubject={draft.updateSubject}
      />
    ) : (
      <Step3Review
        examBoardName={draft.examBoardName}
        isLoading={loading}
        name={draft.name}
        role={draft.role}
        subjects={draft.subjects}
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
            <Button className={buttonStyles.danger} onPress={handleConfirmDiscard}>
              {t('concurso.discardDraft')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
