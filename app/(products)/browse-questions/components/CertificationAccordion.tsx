'use client';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { BrowseCertificationSummary } from '@/shared/types';
import { TopicAccordion } from './TopicAccordion';

interface CertificationAccordionProps {
  readonly certification: BrowseCertificationSummary;
}

export function CertificationAccordion({ certification }: CertificationAccordionProps) {
  return (
    <Accordion
      className="bg-content1 border border-default-200 rounded-xl overflow-hidden p-0"
      itemClasses={{
        base: 'border-0',
        title: 'font-semibold text-foreground',
        trigger: 'px-4 py-3 hover:bg-default-100 transition-colors duration-200',
        content: 'px-3 pb-3',
        indicator: 'text-default-400',
      }}
    >
      <AccordionItem
        key={certification.key}
        title={
          <div className="flex items-center gap-3">
            <span>{certification.label}</span>
            <span className="bg-secondary-100 text-secondary-700 text-xs font-semibold rounded-full px-2 py-0.5">
              {certification.totalCount}
            </span>
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          {certification.topics.map((topic) => (
            <TopicAccordion
              key={topic.name}
              topic={topic}
              certificationTitle={certification.label}
            />
          ))}
        </div>
      </AccordionItem>
    </Accordion>
  );
}
