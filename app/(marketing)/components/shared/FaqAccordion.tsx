'use client';

import { Accordion, AccordionItem } from '@heroui/accordion';

interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

interface FaqAccordionProps {
  readonly items: ReadonlyArray<FaqItem>;
  readonly defaultExpandedKeys?: string[];
  readonly className?: string;
}

export function FaqAccordion({
  items,
  defaultExpandedKeys,
  className = 'gap-0 flex flex-col',
}: FaqAccordionProps) {
  return (
    <Accordion
      className={className}
      defaultExpandedKeys={defaultExpandedKeys}
      itemClasses={{
        base: 'border-b border-mkt-divider bg-transparent border-x-0 border-t-0 first:border-t first:border-mkt-divider',
        title: 'text-lg font-semibold text-mkt-text ds-heading',
        trigger: 'px-0 py-4 hover:bg-transparent data-[hover=true]:bg-transparent',
        content: 'px-0 pb-5 text-base text-mkt-text opacity-60 leading-relaxed',
        indicator: 'text-mkt-text opacity-40',
      }}
    >
      {items.map((item, index) => (
        <AccordionItem key={String(index)} title={item.question}>
          {item.answer}
        </AccordionItem>
      ))}
    </Accordion>
  );
}
