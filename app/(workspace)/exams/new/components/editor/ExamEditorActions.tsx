'use client';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface ExamEditorActionsProps {
  readonly discardLabel: string;
  readonly saveLabel: string;
  readonly isSaving: boolean;
  readonly canSave: boolean;
  readonly onDiscard: () => void;
  readonly onSave: () => void;
  readonly discardTestId?: string;
  readonly saveTestId?: string;
}

// Rendered twice (header + sticky footer) — only pass testids to one copy, or a duplicate
// data-testid trips Playwright's strict-mode locator check.
export function ExamEditorActions({
  discardLabel,
  saveLabel,
  isSaving,
  canSave,
  onDiscard,
  onSave,
  discardTestId,
  saveTestId,
}: ExamEditorActionsProps) {
  const { t } = useTranslation();

  return (
    <>
      <Button
        className={buttonStyles.flat}
        data-testid={discardTestId}
        isDisabled={isSaving}
        size="sm"
        onPress={onDiscard}
      >
        {discardLabel}
      </Button>
      <Button
        className={buttonStyles.primarySm}
        data-testid={saveTestId}
        isDisabled={isSaving || !canSave}
        startContent={isSaving ? <Spinner color="current" size="sm" /> : undefined}
        onPress={onSave}
      >
        {isSaving ? t('chat.saving') : saveLabel}
      </Button>
    </>
  );
}
