'use client';
import type { Selection } from '@react-types/shared';

import { useState } from 'react';
import { Accordion, AccordionItem } from '@heroui/accordion';

import { TopicAccordion } from './TopicAccordion';

import { BrowseCertificationSummary } from '@/shared/types';

interface CertificationAccordionProps {
  readonly certification: BrowseCertificationSummary;
  readonly isOpen: boolean;
}

export function CertificationAccordion({ certification, isOpen }: CertificationAccordionProps) {
  const [openTopicKey, setOpenTopicKey] = useState<string | null>(null);

  function handleTopicSelectionChange(keys: Selection) {
    if (keys === 'all') return;
    const key = keys instanceof Set && keys.size > 0 ? String(Array.from(keys)[0]) : null;

    setOpenTopicKey(key);
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
      selectedKeys={openTopicKey ? [openTopicKey] : []}
      selectionMode="single"
      onSelectionChange={handleTopicSelectionChange}
    >
      {certification.topics.map((topic) => (
        <AccordionItem
          key={topic.name}
          title={
            <div className="flex items-center gap-3">
              <span>{topic.name}</span>
              <span className="bg-primary-100 text-primary-700 text-xs font-semibold rounded-full px-2 py-0.5">
                {topic.questionCount}
              </span>
            </div>
          }
        >
          <TopicAccordion certificationTitle={certification.label} isOpen={openTopicKey === topic.name} topic={topic} />
        </AccordionItem>
      ))}
    </Accordion>
  );
}
