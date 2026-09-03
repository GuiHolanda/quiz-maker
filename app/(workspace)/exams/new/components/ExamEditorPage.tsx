'use client';
import type { BlueprintConfidence, Exam, ExamType } from '@/shared/types';

import { useEffect, useRef, useState } from 'react';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { ExamIdentityFields } from '@/shared/components/exam-editor/ExamIdentityFields';
import { ExamFormatFields } from '@/shared/components/exam-editor/ExamFormatFields';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { WorkspaceSplitLayout } from '@/shared/components/ui/WorkspaceSplitLayout';
import { useExamDraftCard } from '@/features/hooks/useExamDraftCard.hook';
import { getExamDraftValidation } from '@/lib/exam-draft-validation';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';
import { NewExamHeader } from './seed/NewExamHeader';
import { ExamEditorActions } from './editor/ExamEditorActions';
import { ExamEditorFooterBar } from './editor/ExamEditorFooterBar';
import { ExamSectionsCard } from './editor/ExamSectionsCard';
import { ExamReviewSidebar } from './editor/ExamReviewSidebar';

interface ExamEditorPageProps {
  readonly type: ExamType;
  readonly initialDraft: Exam;
  readonly mode?: 'create' | 'edit';
  readonly context?: string;
  readonly sources?: string[];
  readonly confidence?: BlueprintConfidence;
  readonly warningKey?: string;
  readonly onDraftChange?: (
    draft: Exam,
    context?: string,
    sources?: string[],
    confidence?: BlueprintConfidence
  ) => void;
  readonly onSaved: (saved: Exam) => void;
  readonly onDiscard: () => void;
}
export function ExamEditorPage({
  type,
  initialDraft,
  mode = 'create',
  context,
  sources,
  confidence,
  warningKey,
  onDraftChange,
  onSaved,
  onDiscard,
}: ExamEditorPageProps) {
  const { t } = useTranslation();
  const config = EXAM_CONFIG[type];
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const {
    draft,
    status,
    updateField,
    updateNumericField,
    updateReferenceName,
    updateQuestionFormat,
    updateSection,
    removeSection,
    addSection,
    addTopic,
    removeTopic,
    updateTopic,
    handleSave,
  } = useExamDraftCard(initialDraft, mode);

  const isSaving = status === 'saving';
  const validation = getExamDraftValidation(draft);
  const { canSave } = validation;

  const onDraftChangeRef = useRef(onDraftChange);

  onDraftChangeRef.current = onDraftChange;
  useEffect(() => {
    onDraftChangeRef.current?.(draft, context, sources, confidence);
  }, [draft, context, sources, confidence]);

  const handleSaveClick = async () => {
    const result = await handleSave();

    if (result === 'success') onSaved(draft);
  };

  const isEdit = mode === 'edit';
  const discardLabel = isEdit ? t('common.cancel') : t(config.discardDraftLabel);
  const saveLabel = isEdit ? t('common.save') : t('exam.reviewSaveCta');
  const openDiscardConfirm = () => setIsDiscardOpen(true);

  return (
    <>
      <NewExamHeader
        actions={
          <ExamEditorActions
            canSave={canSave}
            discardLabel={discardLabel}
            discardTestId="exam-editor-discard-btn"
            isSaving={isSaving}
            saveLabel={saveLabel}
            saveTestId="exam-editor-save-btn"
            onDiscard={openDiscardConfirm}
            onSave={handleSaveClick}
          />
        }
        activeStep={3}
        showStepper={!isEdit}
        stepLabel={t('exam.reviewStepIndicator')}
        subtitle={t(isEdit ? 'exam.editSubtitle' : 'exam.reviewSubtitle')}
        title={draft.name || t(isEdit ? config.editLabel : config.tabNew)}
      />

      <WorkspaceSplitLayout
        variant="editor"
        rail={
          <ExamReviewSidebar
            confidence={confidence}
            context={context}
            draft={draft}
            sources={sources}
            validation={validation}
          />
        }
      >
        {warningKey && !warningDismissed && (
          <InlineAlert
            color="warning"
            description={t(warningKey)}
            icon={faTriangleExclamation}
            title={t('exam.aiSeedFallbackTitle')}
            onDismiss={() => setWarningDismissed(true)}
          />
        )}

        <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6 pt-4">
          <div className="text-xs font-bold text-default-500 mb-1">{t('exam.identifyCardTitle')}</div>
          <ExamIdentityFields
            density="comfortable"
            draft={draft}
            isSaving={isSaving}
            onUpdateField={updateField}
            onUpdateReferenceName={updateReferenceName}
          />
        </div>

        <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6 pt-4">
          <div className="text-xs font-bold text-default-500 mb-1">{t('exam.formatCardTitle')}</div>
          <ExamFormatFields
            density="comfortable"
            draft={draft}
            isSaving={isSaving}
            onUpdateNumericField={updateNumericField}
            onUpdateQuestionFormat={updateQuestionFormat}
          />
        </div>

        <ExamSectionsCard
          distributionSum={validation.distributionSum}
          isSaving={isSaving}
          sectionCount={validation.sectionCount}
          sections={draft.sections}
          title={t(config.step2SectionsTitle)}
          topicCount={validation.topicCount}
          onAddSection={addSection}
          onAddTopic={addTopic}
          onRemoveSection={removeSection}
          onRemoveTopic={removeTopic}
          onUpdateSection={updateSection}
          onUpdateTopic={updateTopic}
        />

        <ExamEditorFooterBar
          canSave={canSave}
          discardLabel={discardLabel}
          isSaving={isSaving}
          saveLabel={saveLabel}
          onDiscard={openDiscardConfirm}
          onSave={handleSaveClick}
        />
      </WorkspaceSplitLayout>

      <ConfirmModal
        body={<p className="text-sm text-default-500">{t(isEdit ? 'exam.cancelEditBody' : config.discardDraftBody)}</p>}
        confirmLabel={discardLabel}
        confirmTestId="confirm-discard-btn"
        confirmVariant="danger"
        isOpen={isDiscardOpen}
        title={t(isEdit ? 'exam.cancelEditTitle' : config.discardDraftTitle)}
        onClose={() => setIsDiscardOpen(false)}
        onConfirm={() => {
          setIsDiscardOpen(false);
          onDiscard();
        }}
      />
    </>
  );
}
