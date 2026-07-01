'use client';
import { useEffect, useRef, useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Button } from '@heroui/button';

import { QuestionBrowseList, BrowseQuestion } from './QuestionBrowseList';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useBrowseQuestionsDelete } from '@/features/hooks/useBrowseQuestionsDelete.hook';
import { notify } from '@/shared/lib/notify';

interface CategoryQuestionsPanelProps {
  readonly isOpen: boolean;
  readonly selectedIds: Set<number>;
  readonly onQuestionsLoaded: (ids: number[]) => void;
  readonly onSelectionChange: (ids: Set<number>) => void;
  readonly onToggleSelect: (id: number) => void;
  readonly onRegisterBulkTrigger: (fn: () => void) => void;
  readonly fetchPage: (
    page: number,
    pageSize: number,
  ) => Promise<{ questions: BrowseQuestion[]; total: number; page: number; pageSize: number }>;
  readonly deleteQuestion: (id: number) => Promise<void>;
}

export function CategoryQuestionsPanel({
  isOpen,
  selectedIds,
  onQuestionsLoaded,
  onSelectionChange,
  onToggleSelect,
  onRegisterBulkTrigger,
  fetchPage,
  deleteQuestion,
}: CategoryQuestionsPanelProps) {
  const { t } = useTranslation();
  const hasFetched = useRef(false);
  const [questions, setQuestions] = useState<BrowseQuestion[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const deleter = useBrowseQuestionsDelete({
    deleteQuestion,
    onDeleted: (deletedIds) => {
      const deletedSet = new Set(deletedIds);
      const updated = questions.filter((q) => !deletedSet.has(q.id));

      setQuestions(updated);
      setTotal((prev) => Math.max(0, prev - deletedIds.length));
      onQuestionsLoaded(updated.map((q) => q.id));
      onSelectionChange(new Set(Array.from(selectedIds).filter((id) => !deletedSet.has(id))));
    },
  });

  useEffect(() => {
    onRegisterBulkTrigger(() => deleter.requestBulkDelete(Array.from(selectedIds)));
  }, [onRegisterBulkTrigger, selectedIds, deleter]);

  useEffect(() => {
    if (isOpen && !hasFetched.current) {
      hasFetched.current = true;
      loadPage(1, pageSize);
    }
  }, [isOpen]);

  async function loadPage(nextPage: number, nextPageSize: number) {
    setIsLoading(true);
    onSelectionChange(new Set());
    try {
      const data = await fetchPage(nextPage, nextPageSize);

      setQuestions(data.questions);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
      onQuestionsLoaded(data.questions.map((q) => q.id));
    } catch {
      notify.error(t('toast.failedToLoad'), t('browse.loadError'));
    } finally {
      setIsLoading(false);
    }
  }

  const isBulk = deleter.pendingCount > 1;
  const confirmTitleKey = isBulk ? 'browse.bulkDeleteConfirmTitle' : 'browse.singleDeleteConfirmTitle';
  const confirmBodyKey = isBulk ? 'browse.bulkDeleteConfirmBody' : 'browse.singleDeleteConfirmBody';

  return (
    <>
      <QuestionBrowseList
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        questions={questions}
        selectedIds={selectedIds}
        total={total}
        onDeleteRequest={deleter.requestDelete}
        onPageChange={(p) => loadPage(p, pageSize)}
        onPageSizeChange={(ps) => loadPage(1, ps)}
        onToggleSelect={onToggleSelect}
      />
      <Modal
        isDismissable={!deleter.isDeleting}
        isKeyboardDismissDisabled={deleter.isDeleting}
        isOpen={deleter.isConfirmOpen}
        onClose={deleter.cancel}
      >
        <ModalContent>
          <ModalHeader>{t(confirmTitleKey)}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">{t(confirmBodyKey, { count: deleter.pendingCount })}</p>
          </ModalBody>
          <ModalFooter>
            <Button isDisabled={deleter.isDeleting} variant="bordered" onPress={deleter.cancel}>
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-danger text-white font-semibold"
              isLoading={deleter.isDeleting}
              onPress={deleter.confirm}
            >
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
