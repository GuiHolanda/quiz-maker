'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@heroui/skeleton';
import { Chip } from '@heroui/chip';
import { StoredPublicExamQuestion } from '@/shared/types';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { PublicExamQuestionDetailPanel } from './PublicExamQuestionDetailPanel';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface PublicExamQuestionListProps {
  readonly questions: StoredPublicExamQuestion[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly isLoading: boolean;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly onDelete: (id: number) => Promise<void>;
}

export function PublicExamQuestionList({
  questions,
  page,
  pageSize,
  total,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onDelete,
}: PublicExamQuestionListProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function handleItemsPerPageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onPageSizeChange(Number(e.target.value) || 1);
  }

  async function handleDelete(id: number) {
    await onDelete(id);
    setSelectedId(null);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        {isLoading ? (
          <>
            <Skeleton className="h-14 w-full rounded-lg mb-1.5" />
            <Skeleton className="h-14 w-full rounded-lg mb-1.5" />
            <Skeleton className="h-14 w-full rounded-lg mb-1.5" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </>
        ) : (
          questions.map((q) => {
            const isSelected = selectedId === q.id;
            return (
              <React.Fragment key={q.id}>
                <button
                  onClick={() => setSelectedId(isSelected ? null : q.id)}
                  className={`w-full text-left p-4 border-b-2 border-default-100 text-foreground transition-colors duration-150 ${
                    isSelected ? 'bg-content2' : 'bg-content1 hover:bg-content2'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs rounded px-1.5 py-0.5 bg-default-100 text-default-500 capitalize">
                      {q.difficulty}
                    </span>
                    {q.topic && (
                      <span className="text-xs rounded px-1.5 py-0.5 bg-primary-50 text-primary-700">
                        {q.topic}
                      </span>
                    )}
                    <span className="text-xs text-default-400">{q.examBoardName}</span>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={q.answer?.correctOptions?.length > 0 ? 'success' : 'default'}
                      className="ml-auto"
                    >
                      {q.answer?.correctOptions?.length > 0 ? t('browse.hasAnswer') : t('browse.noAnswer')}
                    </Chip>
                  </div>
                  <p className="text-xs leading-snug font-extrabold">{q.text}</p>
                </button>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      key={`detail-${q.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <PublicExamQuestionDetailPanel
                        question={q}
                        onDelete={handleDelete}
                        onClose={() => setSelectedId(null)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })
        )}
      </div>
      {!isLoading && total > 0 && (
        <div className="p-4 flex items-center gap-2 flex-wrap">
          <PaginationControls currentPage={page} totalPages={totalPages} onChange={onPageChange} />
          <div className="ml-auto">
            <ItemsPerPageSelect value={pageSize} onChange={handleItemsPerPageChange} />
          </div>
        </div>
      )}
    </div>
  );
}
