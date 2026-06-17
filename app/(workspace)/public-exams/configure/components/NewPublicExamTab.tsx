'use client';
import { useState } from 'react';
import { addToast } from '@heroui/toast';

import { savePublicExam } from '@/features/connectors';
import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { usePublicExamDraft } from '@/features/hooks/usePublicExamDraft.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2DefineSubjects } from './Step2DefineSubjects';
import { Step3Review } from './Step3Review';

interface NewPublicExamTabProps {
  readonly onBackToLibrary: () => void;
}

export function NewPublicExamTab({ onBackToLibrary }: NewPublicExamTabProps) {
  const { addPublicExam, publicExams } = usePublicExamsContext();
  const { loading, request } = useRequest(savePublicExam);
  const draft = usePublicExamDraft();
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleSave = async () => {
    const name = draft.name.trim();
    const examBoardName = draft.examBoardName.trim();

    if (!name || !examBoardName) {
      addToast({
        title: t('toast.validationError'),
        description: t('error.nameAndBancaRequired'),
        color: 'danger',
      });
      return;
    }

    const yearNum = draft.year ? Number(draft.year) : undefined;
    if (publicExams.some((p) => p.name === name && p.year === yearNum)) {
      addToast({
        title: t('toast.duplicatePublicExam'),
        description: t('error.duplicatePublicExam', { name }),
        color: 'danger',
      });
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
      setStep(1);
      addToast({
        title: t('toast.success'),
        description: t('toast.savedSuccessfully', { title: name }),
        color: 'success',
      });
      onBackToLibrary();
    }
  };

  if (step === 1) {
    return (
      <Step1BasicInfo
        name={draft.name}
        role={draft.role}
        year={draft.year}
        examBoardName={draft.examBoardName}
        onNameChange={draft.setName}
        onRoleChange={draft.setRole}
        onYearChange={draft.setYear}
        onExamBoardChange={draft.setExamBoardName}
        onBack={onBackToLibrary}
        onNext={() => setStep(2)}
      />
    );
  }

  if (step === 2) {
    return (
      <Step2DefineSubjects
        name={draft.name}
        role={draft.role}
        year={draft.year}
        examBoardName={draft.examBoardName}
        subjects={draft.subjects}
        onAddEmptySubject={draft.addEmptySubject}
        onUpdateSubject={draft.updateSubject}
        onRemoveSubject={draft.removeSubject}
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
        onSaveDraft={onBackToLibrary}
      />
    );
  }

  return (
    <Step3Review
      name={draft.name}
      role={draft.role}
      year={draft.year}
      examBoardName={draft.examBoardName}
      subjects={draft.subjects}
      isLoading={loading}
      onBack={() => setStep(2)}
      onSave={handleSave}
    />
  );
}
