'use client';
import { useState } from 'react';

import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2DefineSubjects } from './Step2DefineSubjects';
import { Step3Review } from './Step3Review';

import { savePublicExam } from '@/features/connectors';
import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { usePublicExamDraft } from '@/features/hooks/usePublicExamDraft.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

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
      setStep(1);
      notify.success(t('toast.success'), t('toast.savedSuccessfully', { title: name }));
      onBackToLibrary();
    }
  };

  if (step === 1) {
    return (
      <Step1BasicInfo
        examBoardName={draft.examBoardName}
        name={draft.name}
        role={draft.role}
        year={draft.year}
        onBack={onBackToLibrary}
        onExamBoardChange={draft.setExamBoardName}
        onNameChange={draft.setName}
        onNext={() => setStep(2)}
        onRoleChange={draft.setRole}
        onYearChange={draft.setYear}
      />
    );
  }

  if (step === 2) {
    return (
      <Step2DefineSubjects
        examBoardName={draft.examBoardName}
        name={draft.name}
        role={draft.role}
        subjects={draft.subjects}
        year={draft.year}
        onAddEmptySubject={draft.addEmptySubject}
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
        onRemoveSubject={draft.removeSubject}
        onSaveDraft={onBackToLibrary}
        onUpdateSubject={draft.updateSubject}
      />
    );
  }

  return (
    <Step3Review
      examBoardName={draft.examBoardName}
      isLoading={loading}
      name={draft.name}
      role={draft.role}
      subjects={draft.subjects}
      year={draft.year}
      onBack={() => setStep(2)}
      onSave={handleSave}
    />
  );
}
