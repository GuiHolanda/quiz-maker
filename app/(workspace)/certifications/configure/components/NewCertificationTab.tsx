'use client';

import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2DefineTopics } from './Step2DefineTopics';
import { Step3Review } from './Step3Review';

import { saveCertification } from '@/features/connectors';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useCertificationDraft } from '@/features/hooks/useCertificationDraft.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

interface NewCertificationTabProps {
  readonly onBackToLibrary: () => void;
}

export function NewCertificationTab({ onBackToLibrary }: NewCertificationTabProps) {
  const { addCertification, certifications } = useCertificationsContext();
  const { loading, request } = useRequest(saveCertification);
  const draft = useCertificationDraft();
  const { t } = useTranslation();

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

  const handleDiscard = () => {
    draft.reset();
    onBackToLibrary();
  };

  if (draft.step === 1) {
    return (
      <Step1BasicInfo
        code={draft.code}
        provider={draft.provider}
        title={draft.title}
        onBack={onBackToLibrary}
        onCodeChange={draft.setCode}
        onDiscard={handleDiscard}
        onNext={() => draft.setStep(2)}
        onProviderChange={draft.setProvider}
        onTitleChange={draft.setTitle}
      />
    );
  }

  if (draft.step === 2) {
    return (
      <Step2DefineTopics
        code={draft.code}
        provider={draft.provider}
        title={draft.title}
        topics={draft.topics}
        onAddEmptyTopic={draft.addEmptyTopic}
        onBack={() => draft.setStep(1)}
        onDiscard={handleDiscard}
        onNext={() => draft.setStep(3)}
        onRemoveTopic={draft.removeTopic}
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
      onBack={() => draft.setStep(2)}
      onDiscard={handleDiscard}
      onSave={handleSave}
    />
  );
}
