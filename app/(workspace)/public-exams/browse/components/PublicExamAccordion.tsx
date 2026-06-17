'use client';
import type { Selection } from '@react-types/shared';

import { useState } from 'react';
import { Accordion, AccordionItem } from '@heroui/accordion';

import { SubjectAccordion } from './SubjectAccordion';

import { BrowsePublicExamSummary } from '@/shared/types';

interface PublicExamAccordionProps {
  readonly publicExam: BrowsePublicExamSummary;
  readonly isOpen: boolean;
}

export function PublicExamAccordion({ publicExam, isOpen }: PublicExamAccordionProps) {
  const [openSubjectKey, setOpenSubjectKey] = useState<string | null>(null);

  function handleSubjectSelectionChange(keys: Selection) {
    if (keys === 'all') return;
    const key = keys instanceof Set && keys.size > 0 ? String(Array.from(keys)[0]) : null;

    setOpenSubjectKey(key);
  }

  if (!isOpen) return null;

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
      selectedKeys={openSubjectKey ? [openSubjectKey] : []}
      selectionMode="single"
      onSelectionChange={handleSubjectSelectionChange}
    >
      {publicExam.subjects.map((subject) => (
        <AccordionItem
          key={subject.name}
          title={
            <div className="flex items-center gap-3">
              <span>{subject.name}</span>
              <span className="bg-primary-100 text-primary-700 text-xs font-semibold rounded-full px-2 py-0.5">
                {subject.questionCount}
              </span>
            </div>
          }
        >
          <SubjectAccordion
            isOpen={openSubjectKey === subject.name}
            publicExamName={publicExam.name}
            subject={subject}
          />
        </AccordionItem>
      ))}
    </Accordion>
  );
}
