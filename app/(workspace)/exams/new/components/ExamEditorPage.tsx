'use client';
import type { ReactNode } from 'react';
import type { Exam, ExamType } from '@/shared/types';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { ExamEditor } from '@/shared/components/exam-editor/ExamEditor';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { useExamDraftCard } from '@/features/hooks/useExamDraftCard.hook';
import { getExamDraftValidation } from '@/lib/exam-draft-validation';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';

interface ExamEditorPageProps {
  readonly type: ExamType;
  readonly initialDraft: Exam;
  readonly context?: string;
  readonly sources?: string[];
  readonly warningKey?: string;
  readonly onDraftChange: (draft: Exam) => void;
  readonly onSaved: (saved: Exam) => void;
  readonly onDiscard: () => void;
}

// Tela 2: the same ExamEditor used by the AI-chat draft modal (see plan §2.2-2.3),
// wrapped in page chrome instead of a HeroUI Modal. Mounts once per confirmed seed —
// callers should give it a fresh `initialDraft` rather than mutating one in place, since
// useExamDraftCard only reads it at mount.
export function ExamEditorPage({
  type,
  initialDraft,
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
  } = useExamDraftCard(initialDraft);

  const isSaving = status === 'saving';
  const { canSave } = getExamDraftValidation(draft);

  // Mirrors the draft up to the page so it can be persisted to localStorage the same way
  // the old wizard's draft survived a reload — see page.tsx.
  const onDraftChangeRef = useRef(onDraftChange);

  onDraftChangeRef.current = onDraftChange;
  useEffect(() => {
    onDraftChangeRef.current(draft);
  }, [draft]);

  const handleSaveClick = async () => {
    const result = await handleSave();

    if (result === 'success') onSaved(draft);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="page-header-title truncate">{draft.name || t(config.tabNew)}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            className={buttonStyles.flat}
            data-testid="exam-editor-discard-btn"
            isDisabled={isSaving}
            size="sm"
            onPress={() => setIsDiscardOpen(true)}
          >
            {t(config.discardDraftLabel)}
          </Button>
          <Button
            className={buttonStyles.primarySm}
            data-testid="exam-editor-save-btn"
            isDisabled={isSaving || !canSave}
            startContent={isSaving ? <Spinner color="current" size="sm" /> : undefined}
            onPress={handleSaveClick}
          >
            {isSaving ? t('chat.saving') : t('common.save')}
          </Button>
        </div>
      </div>

      {warningKey && !warningDismissed && (
        <InlineAlert
          color="warning"
          description={t(warningKey)}
          icon={faTriangleExclamation}
          title={t('exam.aiSeedFallbackTitle')}
          onDismiss={() => setWarningDismissed(true)}
        />
      )}

      {context && (
        <InlineAlert
          color="primary"
          description={renderMarkdownBold(context)}
          icon={faCircleInfo}
          title={t('exam.aiSeedProvenanceTitle')}
          variant="subtle"
          endContent={
            sources && sources.length > 0 ? (
              <a
                className="text-xs text-primary font-semibold flex items-center gap-1 shrink-0 hover:opacity-80"
                href={extractUrl(sources[0])}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t('exam.aiSeedViewSource')}
                <FontAwesomeIcon className="w-3 h-3" icon={faArrowUpRightFromSquare} />
              </a>
            ) : undefined
          }
        />
      )}

      <div className="bg-content1 border border-default-200 rounded-xl p-6">
        <ExamEditor
          draft={draft}
          isSaving={isSaving}
          onAddTopic={addTopic}
          onRemoveSection={removeSection}
          onRemoveTopic={removeTopic}
          onUpdateField={updateField}
          onUpdateNumericField={updateNumericField}
          onUpdateQuestionFormat={updateQuestionFormat}
          onUpdateReferenceName={updateReferenceName}
          onUpdateSection={updateSection}
          onUpdateTopic={updateTopic}
        />
        <div className="flex items-center gap-3 mt-4">
          <Button className={`${buttonStyles.flat} text-xs`} isDisabled={isSaving} size="sm" onPress={addSection}>
            {t('exam.addSection')}
          </Button>
          {draft.sections.length === 0 && (
            <span className="text-xs text-warning">{t('exam.aiSeedNoSectionsHint')}</span>
          )}
        </div>
      </div>

      <ConfirmModal
        body={<p className="text-sm text-default-500">{t(config.discardDraftBody)}</p>}
        confirmLabel={t(config.discardDraftLabel)}
        confirmTestId="confirm-discard-btn"
        confirmVariant="danger"
        isOpen={isDiscardOpen}
        title={t(config.discardDraftTitle)}
        onClose={() => setIsDiscardOpen(false)}
        onConfirm={() => {
          setIsDiscardOpen(false);
          onDiscard();
        }}
      />
    </div>
  );
}

// Sources come from the model as markdown links — "[Title](https://...)" — extract the
// URL for the "view source" CTA rather than rendering markdown in the banner.
function extractUrl(source: string): string {
  const match = /\((https?:\/\/[^)]+)\)/.exec(source);

  return match ? match[1] : source;
}

// The model's "context" sentence uses **bold** for the certification name (see
// AI_CHAT_TOPICS_PROMPT's examples) — InlineAlert's description renders plain text, so
// without this the asterisks would show up literally instead of as emphasis.
function renderMarkdownBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}
