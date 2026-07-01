'use client';
import type { Selection } from '@react-types/shared';

import { useRef, useState } from 'react';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Checkbox } from '@heroui/checkbox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import { TopicAccordion } from './TopicAccordion';

import { BrowseCertificationSummary } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface CertificationAccordionProps {
  readonly certification: BrowseCertificationSummary;
  readonly isOpen: boolean;
}

export function CertificationAccordion({ certification, isOpen }: CertificationAccordionProps) {
  const { t } = useTranslation();
  const [openTopicKey, setOpenTopicKey] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loadedQuestionIds, setLoadedQuestionIds] = useState<number[]>([]);
  const bulkDeleteTriggerRef = useRef<(() => void) | null>(null);

  function handleTopicSelectionChange(keys: Selection) {
    if (keys === 'all') return;
    const key = keys instanceof Set && keys.size > 0 ? String(Array.from(keys)[0]) : null;

    setOpenTopicKey(key);
    setSelectedIds(new Set());
    setLoadedQuestionIds([]);
  }

  if (!isOpen) return null;

  const allSelected = loadedQuestionIds.length > 0 && selectedIds.size === loadedQuestionIds.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < loadedQuestionIds.length;

  return (
    <Accordion
      className="flex flex-col gap-2 p-0 shadow-none"
      itemClasses={{
        base: 'bg-content1 border border-default-100 rounded-lg overflow-hidden',
        title: 'font-medium text-foreground text-sm',
        trigger: 'px-4 py-2.5 hover:bg-default-100 transition-colors duration-200',
        content: 'p-0',
        indicator: 'text-default-400',
      }}
      selectedKeys={openTopicKey ? [openTopicKey] : []}
      selectionMode="single"
      onSelectionChange={handleTopicSelectionChange}
    >
      {certification.topics.map((topic) => {
        const isTopicOpen = openTopicKey === topic.name;

        return (
          <AccordionItem
            key={topic.name}
            title={
              <div className="flex items-center gap-3 w-full">
                <span>{topic.name}</span>
                <span className="bg-primary-100 text-primary-700 text-xs font-semibold rounded-full px-2 py-0.5">
                  {topic.questionCount}
                </span>
                {isTopicOpen && loadedQuestionIds.length > 0 && (
                  <div
                    className="ml-auto flex items-center gap-1"
                    role="presentation"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      isIndeterminate={isIndeterminate}
                      isSelected={allSelected}
                      size="sm"
                      onValueChange={(checked) =>
                        checked ? setSelectedIds(new Set(loadedQuestionIds)) : setSelectedIds(new Set())
                      }
                    >
                      <span className="text-xs text-default-500">{t('common.selectAll')}</span>
                    </Checkbox>
                    {selectedIds.size > 0 && (
                      <span
                        className="p-1.5 text-default-400 hover:text-danger hover:bg-danger/10 transition-colors rounded-md cursor-pointer inline-flex items-center"
                        role="button"
                        tabIndex={0}
                        onClick={() => bulkDeleteTriggerRef.current?.()}
                        onKeyDown={(e) => e.key === 'Enter' && bulkDeleteTriggerRef.current?.()}
                      >
                        <FontAwesomeIcon className="w-4 h-4" icon={faTrash} />
                      </span>
                    )}
                  </div>
                )}
              </div>
            }
          >
            <TopicAccordion
              certificationTitle={certification.label}
              isOpen={isTopicOpen}
              selectedIds={selectedIds}
              topic={topic}
              onQuestionsLoaded={setLoadedQuestionIds}
              onRegisterBulkTrigger={(fn) => {
                bulkDeleteTriggerRef.current = fn;
              }}
              onSelectionChange={setSelectedIds}
              onToggleSelect={(id) =>
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
            />
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
