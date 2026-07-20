'use client';
import React, { useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@heroui/skeleton';
import { Chip } from '@heroui/chip';
import { Checkbox } from '@heroui/checkbox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faTrash } from '@fortawesome/free-solid-svg-icons';

import { QuestionBrowseDetailPanel } from './QuestionBrowseDetailPanel';

import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export interface BrowseQuestion {
  readonly id: number;
  readonly text: string;
  readonly difficulty: string;
  readonly options: Record<string, string>;
  readonly answer: { correctOptions: string[]; explanations: Record<string, string> } | null | undefined;
  readonly primaryLabel: string;
  readonly topicBadge?: string;
}

interface QuestionBrowseListProps {
  readonly questions: BrowseQuestion[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly isLoading: boolean;
  readonly selectedIds: Set<number>;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly onToggleSelect: (id: number) => void;
  readonly onDeleteRequest: (id: number) => void;
}

export function QuestionBrowseList({
  questions,
  page,
  pageSize,
  total,
  isLoading,
  selectedIds,
  onPageChange,
  onPageSizeChange,
  onToggleSelect,
  onDeleteRequest,
}: QuestionBrowseListProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const detailBaseId = useId();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // When at least one row is selected, force-show every checkbox — otherwise
  // the invisible checkbox on non-hovered rows makes it look like selection
  // is impossible for those rows.
  const anySelected = selectedIds.size > 0;

  function handleItemsPerPageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onPageSizeChange(Number(e.target.value) || 1);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">{isLoading ? renderSkeleton() : questions.map((q) => renderQuestionRow(q))}</div>
      {!isLoading && total > 0 && renderPagination()}
    </div>
  );

  function renderSkeleton() {
    return (
      <>
        <Skeleton className="h-20 w-full rounded-lg mb-2" />
        <Skeleton className="h-20 w-full rounded-lg mb-2" />
        <Skeleton className="h-20 w-full rounded-lg mb-2" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </>
    );
  }

  function renderQuestionRow(q: BrowseQuestion) {
    const isExpanded = expandedId === q.id;
    const isChecked = selectedIds.has(q.id);
    const correctOptions = q.answer?.correctOptions ?? [];
    const explanations = q.answer?.explanations ?? {};
    const detailId = `${detailBaseId}-${q.id}`;
    const rowBg = isExpanded
      ? 'bg-primary/10 border-l-2 border-l-primary'
      : isChecked
        ? 'bg-primary/5'
        : 'hover:bg-primary/5';
    // Gmail-style: hidden on md+ until row is hovered / focused / anything is selected.
    // On <md always visible so touch users can reach it.
    const showAffordances = isChecked || anySelected;
    const checkboxVisibility = showAffordances
      ? 'opacity-100'
      : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100';
    const trashVisibility = showAffordances
      ? 'opacity-100'
      : 'opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 focus-visible:opacity-100';

    return (
      <React.Fragment key={q.id}>
        <div
          className={`group w-full flex items-stretch border-b border-default-100 text-foreground transition-colors duration-150 cursor-pointer ${rowBg}`}
        >
          <div
            className={`flex items-center justify-center w-11 flex-shrink-0 transition-opacity duration-150 motion-reduce:transition-none ${checkboxVisibility}`}
            role="presentation"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(q.id);
            }}
          >
            <Checkbox
              aria-label={t('common.select')}
              isSelected={isChecked}
              size="sm"
              onValueChange={() => onToggleSelect(q.id)}
            />
          </div>
          <button
            aria-controls={detailId}
            aria-expanded={isExpanded}
            className="flex-1 text-left py-4 pr-2 min-w-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary rounded-r-md"
            type="button"
            onClick={() => setExpandedId(isExpanded ? null : q.id)}
          >
            <div className="flex items-center gap-2 mb-2 min-w-0">
              {q.topicBadge && (
                <Chip
                  className="flex-shrink-0 max-w-[16rem]"
                  color="default"
                  size="sm"
                  title={q.topicBadge}
                  variant="flat"
                >
                  <span className="truncate">{q.topicBadge}</span>
                </Chip>
              )}
              <FontAwesomeIcon
                className={`ml-auto flex-shrink-0 h-3 w-3 text-default-400 transition-transform duration-200 motion-reduce:transition-none ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                icon={faChevronDown}
              />
            </div>
            <p className="text-sm leading-snug text-foreground line-clamp-2">{q.text}</p>
          </button>
          <div
            className={`flex items-center justify-center w-11 flex-shrink-0 transition-opacity duration-150 motion-reduce:transition-none ${trashVisibility}`}
          >
            <button
              aria-label={t('browse.deleteQuestion')}
              className="h-9 w-9 grid place-items-center rounded-md text-default-400 hover:text-danger hover:bg-danger/10 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(q.id);
              }}
            >
              <FontAwesomeIcon className="h-3.5 w-3.5" icon={faTrash} />
            </button>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key={`detail-${q.id}`}
              animate={{ height: 'auto', opacity: 1 }}
              className="overflow-hidden"
              exit={{ height: 0, opacity: 0 }}
              id={detailId}
              initial={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <QuestionBrowseDetailPanel
                correctOptions={correctOptions}
                difficulty={q.difficulty}
                explanations={explanations}
                hasAnswer={correctOptions.length > 0}
                options={q.options}
                questionText={q.text}
                onClose={() => setExpandedId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </React.Fragment>
    );
  }

  function renderPagination() {
    return (
      <div className="p-4 flex items-center gap-2 flex-wrap">
        <PaginationControls currentPage={page} totalPages={totalPages} onChange={onPageChange} />
        <div className="ml-auto">
          <ItemsPerPageSelect value={pageSize} onChange={handleItemsPerPageChange} />
        </div>
      </div>
    );
  }
}
