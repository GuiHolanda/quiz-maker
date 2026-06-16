'use client';
import { useState } from 'react';
import { addToast } from '@heroui/toast';

import { saveCertification } from '@/features/connectors';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useCertificationDraft } from '@/features/hooks/useCertificationDraft.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2DefineTopics } from './Step2DefineTopics';
import { Step3Review } from './Step3Review';

interface NewCertificationTabProps {
  readonly onBackToLibrary: () => void;
}

export function NewCertificationTab({ onBackToLibrary }: NewCertificationTabProps) {
  const { addCertification, certifications } = useCertificationsContext();
  const { loading, request } = useRequest(saveCertification);
  const draft = useCertificationDraft();
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleSave = async () => {
    const label = draft.title.trim();
    const key = draft.code.trim();

    if (!label || !key) {
      addToast({ title: t('toast.validationError'), description: t('error.titleCodeRequired'), color: 'danger' });
      return;
    }

    if (certifications.some((c) => c.key === key)) {
      addToast({ title: t('toast.duplicateCertification'), description: t('error.duplicateCode', { code: key }), color: 'danger' });
      return;
    }

    const certification = { label, key, provider: draft.provider || undefined, topics: draft.topics };
    const saved = await request(certification);

    if (saved) {
      addCertification(certification);
      draft.reset();
      setStep(1);
      addToast({ title: t('toast.success'), description: t('toast.savedSuccessfully', { title: label }), color: 'success' });
      onBackToLibrary();
    }
  };

  if (step === 1) {
    return (
      <Step1BasicInfo
        title={draft.title}
        code={draft.code}
        provider={draft.provider}
        onTitleChange={draft.setTitle}
        onCodeChange={draft.setCode}
        onProviderChange={draft.setProvider}
        onBack={onBackToLibrary}
        onNext={() => setStep(2)}
      />
    );
  }

  if (step === 2) {
    return (
      <Step2DefineTopics
        title={draft.title}
        code={draft.code}
        provider={draft.provider}
        topics={draft.topics}
        onAddEmptyTopic={draft.addEmptyTopic}
        onUpdateTopic={draft.updateTopic}
        onRemoveTopic={draft.removeTopic}
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
        onSaveDraft={onBackToLibrary}
      />
    );
  }

  return (
    <Step3Review
      title={draft.title}
      code={draft.code}
      provider={draft.provider}
      topics={draft.topics}
      isLoading={loading}
      onBack={() => setStep(2)}
      onSave={handleSave}
    />
  );
}
