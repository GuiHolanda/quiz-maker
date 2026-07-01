'use client';
import { useCallback, useState } from 'react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

type ConfirmMode = { readonly kind: 'single'; readonly id: number } | { readonly kind: 'bulk'; readonly ids: number[] };

interface UseBrowseQuestionsDeleteArgs {
  readonly deleteQuestion: (id: number) => Promise<void>;
  readonly onDeleted: (deletedIds: number[]) => void;
}

interface UseBrowseQuestionsDeleteResult {
  readonly isConfirmOpen: boolean;
  readonly isDeleting: boolean;
  readonly pendingCount: number;
  readonly requestDelete: (id: number) => void;
  readonly requestBulkDelete: (ids: number[]) => void;
  readonly cancel: () => void;
  readonly confirm: () => Promise<void>;
}

export function useBrowseQuestionsDelete({
  deleteQuestion,
  onDeleted,
}: UseBrowseQuestionsDeleteArgs): UseBrowseQuestionsDeleteResult {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ConfirmMode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDelete = useCallback((id: number) => setMode({ kind: 'single', id }), []);
  const requestBulkDelete = useCallback((ids: number[]) => {
    if (ids.length === 0) return;
    setMode({ kind: 'bulk', ids });
  }, []);

  const cancel = useCallback(() => {
    if (isDeleting) return;
    setMode(null);
  }, [isDeleting]);

  const confirm = useCallback(async () => {
    if (!mode) return;
    const ids = mode.kind === 'single' ? [mode.id] : mode.ids;

    setIsDeleting(true);
    try {
      const results = await Promise.allSettled(ids.map((id) => deleteQuestion(id)));
      const deletedIds = ids.filter((_, i) => results[i].status === 'fulfilled');
      const failedCount = results.length - deletedIds.length;

      if (deletedIds.length > 0) onDeleted(deletedIds);

      if (failedCount === 0) {
        setMode(null);
        const successKey = mode.kind === 'single' ? 'browse.deleteSuccess' : 'browse.bulkDeleteSuccess';

        notify.success(t('toast.success'), t(successKey));
      } else {
        notify.error(t('toast.error'), t('browse.deleteError'));
      }
    } finally {
      setIsDeleting(false);
    }
  }, [mode, deleteQuestion, onDeleted, t]);

  return {
    isConfirmOpen: mode !== null,
    isDeleting,
    pendingCount: mode?.kind === 'bulk' ? mode.ids.length : mode?.kind === 'single' ? 1 : 0,
    requestDelete,
    requestBulkDelete,
    cancel,
    confirm,
  };
}
