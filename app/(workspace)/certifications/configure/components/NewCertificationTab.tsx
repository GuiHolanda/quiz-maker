'use client';
import { useState } from 'react';
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

export function NewCertificationTab({ onBackToLibrary }: NewCertificationTabProps) {
  const { addCertification, certifications } = useCertificationsContext();
  const { loading, request } = useRequest(saveCertification);
  const draft = useCertificationDraft();
  const { t } = useTranslation();
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

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

    const certification = { label, key, provider: draft.provider || undefined, topics: draft.topics };
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

  if (draft.step === 1) {
    return renderStep(
      <Step1BasicInfo
        code={draft.code}
        provider={draft.provider}
        title={draft.title}
        onBack={onBackToLibrary}
        onCodeChange={draft.setCode}
        onDiscard={() => setIsDiscardOpen(true)}
        onNext={() => draft.setStep(2)}
        onProviderChange={draft.setProvider}
        onTitleChange={draft.setTitle}
      />
    );
  }

  if (draft.step === 2) {
    return renderStep(
      <Step2DefineTopics
        code={draft.code}
        provider={draft.provider}
        title={draft.title}
        topics={draft.topics}
        onAddEmptyTopic={draft.addEmptyTopic}
        onBack={() => draft.setStep(1)}
        onDiscard={() => setIsDiscardOpen(true)}
        onNext={() => draft.setStep(3)}
        onRemoveTopic={draft.removeTopic}
        onUpdateTopic={draft.updateTopic}
      />
    );
  }

  return renderStep(
    <Step3Review
      code={draft.code}
      isLoading={loading}
      provider={draft.provider}
      title={draft.title}
      topics={draft.topics}
      onBack={() => draft.setStep(2)}
      onDiscard={() => setIsDiscardOpen(true)}
      onSave={handleSave}
    />
  );

  function renderStep(step: React.ReactNode) {
    return (
      <>
        {step}
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
}
