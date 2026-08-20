'use client';
import type { Exam, ExamType } from '@/shared/types';

import { useEffect, useRef, useState } from 'react';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { ExamIdentityFields } from '@/shared/components/exam-editor/ExamIdentityFields';
import { ExamFormatFields } from '@/shared/components/exam-editor/ExamFormatFields';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
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
  readonly warningKey?: string;
  readonly onDraftChange?: (draft: Exam, context?: string, sources?: string[]) => void;
  readonly onSaved: (saved: Exam) => void;
  readonly onDiscard: () => void;
}
export function ExamEditorPage({
  type,
  initialDraft,
  mode = 'create',
  context,
  sources,
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
    onDraftChangeRef.current?.(draft, context, sources);
  }, [draft, context, sources]);

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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start mt-7">
        <div className="flex flex-col gap-4">
          {warningKey && !warningDismissed && (
            <InlineAlert
              color="warning"
              description={t(warningKey)}
              icon={faTriangleExclamation}
              title={t('exam.aiSeedFallbackTitle')}
              onDismiss={() => setWarningDismissed(true)}
            />
          )}

          <div className="bg-content1 border border-default-200 rounded-xl p-6">
            <div className="font-mono text-[11px] uppercase tracking-widest text-default-400 mb-4">
              {t('exam.identifyCardTitle')}
            </div>
            <ExamIdentityFields
              density="comfortable"
              draft={draft}
              isSaving={isSaving}
              onUpdateField={updateField}
              onUpdateReferenceName={updateReferenceName}
            />
          </div>

          <div className="bg-content1 border border-default-200 rounded-xl p-6">
            <div className="font-mono text-[11px] uppercase tracking-widest text-default-400 mb-4">
              {t('exam.formatCardTitle')}
            </div>
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
        </div>

        <ExamReviewSidebar context={context} draft={draft} sources={sources} validation={validation} />
      </div>

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
