'use client';
import { useState } from 'react';
import { addToast } from '@heroui/toast';

import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2DefineTopics } from './Step2DefineTopics';
import { Step3Review } from './Step3Review';

import { saveCertification } from '@/features/connectors';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useCertificationDraft } from '@/features/hooks/useCertificationDraft.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

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
      addToast({
        title: t('toast.duplicateCertification'),
        description: t('error.duplicateCode', { code: key }),
        color: 'danger',
      });

      return;
    }

    const certification = { label, key, provider: draft.provider || undefined, topics: draft.topics };
    const saved = await request(certification);

    if (saved) {
      addCertification(certification);
      draft.reset();
      setStep(1);
      addToast({
        title: t('toast.success'),
        description: t('toast.savedSuccessfully', { title: label }),
        color: 'success',
      });
      onBackToLibrary();
    }
  };

  if (step === 1) {
    return (
      <Step1BasicInfo
        code={draft.code}
        provider={draft.provider}
        title={draft.title}
        onBack={onBackToLibrary}
        onCodeChange={draft.setCode}
        onNext={() => setStep(2)}
        onProviderChange={draft.setProvider}
        onTitleChange={draft.setTitle}
      />
    );
  }

  if (step === 2) {
    return (
      <Step2DefineTopics
        code={draft.code}
        provider={draft.provider}
        title={draft.title}
        topics={draft.topics}
        onAddEmptyTopic={draft.addEmptyTopic}
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
        onRemoveTopic={draft.removeTopic}
        onSaveDraft={onBackToLibrary}
        onUpdateTopic={draft.updateTopic}
      />
    );
  }

  return (
    <Step3Review
      code={draft.code}
      isLoading={loading}
      provider={draft.provider}
      title={draft.title}
      topics={draft.topics}
      onBack={() => setStep(2)}
      onSave={handleSave}
    />
  );
}
