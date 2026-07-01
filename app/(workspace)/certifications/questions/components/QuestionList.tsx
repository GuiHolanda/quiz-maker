'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@heroui/skeleton';
import { Chip } from '@heroui/chip';
import { Checkbox } from '@heroui/checkbox';

import { QuestionDetailPanel } from './QuestionDetailPanel';

import { StoredQuestion } from '@/shared/types';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface QuestionListProps {
  readonly questions: StoredQuestion[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly isLoading: boolean;
  readonly selectedIds: Set<number>;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly onDelete: (id: number) => Promise<void>;
  readonly onToggleSelect: (id: number) => void;
}

export function QuestionList({
  questions,
  page,
  pageSize,
  total,
  isLoading,
  selectedIds,
  onPageChange,
  onPageSizeChange,
  onDelete,
  onToggleSelect,
}: QuestionListProps) {
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
            const isChecked = selectedIds.has(q.id);

            return (
              <React.Fragment key={q.id}>
                <div
                  className={`w-full flex items-stretch border-b-2 border-default-100 text-foreground transition-colors duration-150 ${
                    isSelected || isChecked ? 'bg-content2' : 'bg-content1 hover:bg-content2'
                  }`}
                >
                  <div
                    className="flex items-center px-3 cursor-pointer flex-shrink-0"
                    role="presentation"
                    onClick={() => onToggleSelect(q.id)}
                  >
                    <Checkbox isSelected={isChecked} size="sm" onValueChange={() => onToggleSelect(q.id)} />
                  </div>
                  <button
                    className="flex-1 text-left py-4 pr-4 min-w-0"
                    onClick={() => setSelectedId(isSelected ? null : q.id)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs rounded px-1.5 py-0.5 bg-default-100 text-default-500 capitalize">
                        {q.difficulty}
                      </span>
                      <span className="text-xs text-default-400">{q.certificationTitle}</span>
                      <Chip
                        className="ml-auto"
                        color={q.answer?.correctOptions?.length > 0 ? 'success' : 'default'}
                        size="sm"
                        variant="flat"
                      >
                        {q.answer?.correctOptions?.length > 0 ? t('browse.hasAnswer') : t('browse.noAnswer')}
                      </Chip>
                    </div>
                    <p className="text-xs leading-snug font-extrabold">{q.text}</p>
                  </button>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      key={`detail-${q.id}`}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="overflow-hidden"
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <QuestionDetailPanel question={q} onClose={() => setSelectedId(null)} onDelete={handleDelete} />
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
