'use client';
import { useEffect, useRef, useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Button } from '@heroui/button';

import { QuestionList } from './QuestionList';

import { StoredQuestion, BrowseTopicSummary } from '@/shared/types';
import { getBrowseQuestions, deleteBrowseQuestion } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

interface TopicAccordionProps {
  readonly topic: BrowseTopicSummary;
  readonly certificationTitle: string;
  readonly isOpen: boolean;
  readonly selectedIds: Set<number>;
  readonly onQuestionsLoaded: (ids: number[]) => void;
  readonly onSelectionChange: (ids: Set<number>) => void;
  readonly onToggleSelect: (id: number) => void;
  readonly onRegisterBulkTrigger: (fn: () => void) => void;
}

export function TopicAccordion({
  topic,
  certificationTitle,
  isOpen,
  selectedIds,
  onQuestionsLoaded,
  onSelectionChange,
  onToggleSelect,
  onRegisterBulkTrigger,
}: TopicAccordionProps) {
  const { t } = useTranslation();
  const hasFetched = useRef(false);
  const [questions, setQuestions] = useState<StoredQuestion[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    onRegisterBulkTrigger(() => setShowBulkDeleteConfirm(true));
  }, [onRegisterBulkTrigger]);

  useEffect(() => {
    if (isOpen && !hasFetched.current) {
      hasFetched.current = true;
      fetchQuestions(1, pageSize);
    }
  }, [isOpen]);

  async function fetchQuestions(nextPage: number, nextPageSize: number) {
    setIsLoading(true);
    onSelectionChange(new Set());
    try {
      const data = await getBrowseQuestions({
        certificationTitle,
        topic: topic.name,
        page: nextPage,
        pageSize: nextPageSize,
      });

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

  async function handleDelete(id: number) {
    try {
      await deleteBrowseQuestion(id);
      const updated = questions.filter((q) => q.id !== id);

      setQuestions(updated);
      setTotal((prev) => prev - 1);
      onQuestionsLoaded(updated.map((q) => q.id));
      onSelectionChange(new Set(Array.from(selectedIds).filter((sid) => sid !== id)));
      notify.success(t('toast.success'), t('browse.deleteSuccess'));
    } catch {
      notify.error(t('toast.error'), t('browse.deleteError'));
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);

    setIsBulkDeleting(true);
    try {
      const results = await Promise.allSettled(ids.map((id) => deleteBrowseQuestion(id)));
      const deletedIds = new Set(ids.filter((_, i) => results[i].status === 'fulfilled'));
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      if (deletedIds.size > 0) {
        const updated = questions.filter((q) => !deletedIds.has(q.id));

        setQuestions(updated);
        setTotal((prev) => prev - deletedIds.size);
        onQuestionsLoaded(updated.map((q) => q.id));
        onSelectionChange(new Set(Array.from(selectedIds).filter((id) => !deletedIds.has(id))));
      }

      if (failedCount === 0) {
        setShowBulkDeleteConfirm(false);
        notify.success(t('toast.success'), t('browse.bulkDeleteSuccess'));
      } else {
        notify.error(t('toast.error'), t('browse.deleteError'));
      }
    } finally {
      setIsBulkDeleting(false);
    }
  }

  return (
    <>
      <QuestionList
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        questions={questions}
        selectedIds={selectedIds}
        total={total}
        onDelete={handleDelete}
        onPageChange={(p) => fetchQuestions(p, pageSize)}
        onPageSizeChange={(ps) => fetchQuestions(1, ps)}
        onToggleSelect={onToggleSelect}
      />
      <Modal
        isDismissable={!isBulkDeleting}
        isKeyboardDismissDisabled={isBulkDeleting}
        isOpen={showBulkDeleteConfirm}
        onClose={() => !isBulkDeleting && setShowBulkDeleteConfirm(false)}
      >
        <ModalContent>
          <ModalHeader>{t('browse.bulkDeleteConfirmTitle')}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">
              {t('browse.bulkDeleteConfirmBody', { count: selectedIds.size })}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              isDisabled={isBulkDeleting}
              variant="bordered"
              onPress={() => setShowBulkDeleteConfirm(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-danger text-white font-semibold"
              isLoading={isBulkDeleting}
              onPress={handleBulkDelete}
            >
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
