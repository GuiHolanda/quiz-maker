'use client';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { ExamEditorActions } from '@/app/(workspace)/exams/new/components/editor/ExamEditorActions';

interface ExamEditorFooterBarProps {
  readonly canSave: boolean;
  readonly discardLabel: string;
  readonly saveLabel: string;
  readonly isSaving: boolean;
  readonly onDiscard: () => void;
  readonly onSave: () => void;
}

// bg-background2, not bg-content1 — that's the real shell background behind scrolled content.
export function ExamEditorFooterBar({
  canSave,
  discardLabel,
  saveLabel,
  isSaving,
  onDiscard,
  onSave,
}: ExamEditorFooterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky bottom-0 z-20 flex items-center justify-between gap-6 bg-background2 border-t border-divider py-4">
      <p className="text-sm text-default-500">{t(canSave ? 'exam.footerReady' : 'exam.footerBlocked')}</p>
      <div className="flex items-center gap-2 shrink-0">
        <ExamEditorActions
          canSave={canSave}
          discardLabel={discardLabel}
          isSaving={isSaving}
          saveLabel={saveLabel}
          onDiscard={onDiscard}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
