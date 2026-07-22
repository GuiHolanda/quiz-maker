'use client';
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';

import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2DefineTopics } from './Step2DefineTopics';
import { Step3Review } from './Step3Review';

import { saveCertification } from '@/features/connectors';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useCertificationDraft } from '@/features/hooks/useCertificationDraft.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface NewCertificationTabProps {
  readonly onBackToLibrary: () => void;
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function NewCertificationTab({ onBackToLibrary }: NewCertificationTabProps) {
  const { addCertification, certifications } = useCertificationsContext();
  const { loading, request } = useRequest(saveCertification);
  const draft = useCertificationDraft();
  const { t } = useTranslation();
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const prevStep = useRef(draft.step);

  const direction = draft.step > prevStep.current ? 1 : -1;

  const goToStep = (next: 1 | 2 | 3) => {
    prevStep.current = draft.step;
    draft.setStep(next);
  };

  const handleSave = async () => {
    const label = draft.title.trim();
    const key = draft.code.trim();

    if (!label || !key) {
      notify.error(t('toast.validationError'), t('error.titleCodeRequired'));
      return;
    }

    if (certifications.some((c) => c.key === key)) {
      notify.error(t('toast.duplicateCertification'), t('error.duplicateCode', { code: key }));
      return;
    }

    const certification = {
      label,
      key,
      provider: draft.provider || undefined,
      totalQuestions: parseInt(draft.totalQuestions, 10),
      examDurationMinutes: parseInt(draft.examDurationMinutes, 10) || undefined,
      passingScore: parseFloat(draft.passingScore) || undefined,
      topics: draft.topics,
    };
    const saved = await request(certification);

    if (saved) {
      addCertification(saved);
      draft.reset();
      notify.success(t('toast.success'), t('toast.savedSuccessfully', { title: label }));
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
        code={draft.code}
        examDurationMinutes={draft.examDurationMinutes}
        passingScore={draft.passingScore}
        provider={draft.provider}
        title={draft.title}
        totalQuestions={draft.totalQuestions}
        onBack={onBackToLibrary}
        onCodeChange={draft.setCode}
        onDiscard={() => setIsDiscardOpen(true)}
        onExamDurationMinutesChange={draft.setExamDurationMinutes}
        onNext={() => goToStep(2)}
        onPassingScoreChange={draft.setPassingScore}
        onProviderChange={draft.setProvider}
        onTitleChange={draft.setTitle}
        onTotalQuestionsChange={draft.setTotalQuestions}
      />
    ) : draft.step === 2 ? (
      <Step2DefineTopics
        code={draft.code}
        provider={draft.provider}
        title={draft.title}
        topics={draft.topics}
        onAddEmptyTopic={draft.addEmptyTopic}
        onBack={() => goToStep(1)}
        onDiscard={() => setIsDiscardOpen(true)}
        onNext={() => goToStep(3)}
        onRemoveTopic={draft.removeTopic}
        onUpdateTopic={draft.updateTopic}
      />
    ) : (
      <Step3Review
        code={draft.code}
        examDurationMinutes={parseInt(draft.examDurationMinutes, 10) || undefined}
        isLoading={loading}
        passingScore={parseFloat(draft.passingScore) || undefined}
        provider={draft.provider}
        title={draft.title}
        topics={draft.topics}
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

      <Modal isOpen={isDiscardOpen} size="sm" onClose={() => setIsDiscardOpen(false)}>
        <ModalContent>
          <ModalHeader>{t('certification.discardDraftTitle')}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">{t('certification.discardDraftBody')}</p>
          </ModalBody>
          <ModalFooter>
            <Button className={buttonStyles.secondary} variant="bordered" onPress={() => setIsDiscardOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button className={buttonStyles.danger} onPress={handleConfirmDiscard}>
              {t('certification.discardDraft')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
