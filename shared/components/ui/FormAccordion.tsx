'use client';

import { Accordion, AccordionItem } from '@heroui/accordion';
import { Form } from '@heroui/form';
import { Divider } from '@heroui/divider';
import { BusyDialog } from './BusyDialog';

interface FormAccordionProps {
  title: string;
  accordionKey: string;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  validationErrors?: Record<string, string>;
  isLoading?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function FormAccordion({
  title,
  accordionKey,
  onSubmit,
  validationErrors,
  isLoading,
  footer,
  children,
}: Readonly<FormAccordionProps>) {
  const body = (
    <div className="w-full flex flex-col gap-8 pt-6">
      {children}
    </div>
  );

  return (
    <Accordion
      defaultExpandedKeys={[accordionKey]}
      className="bg-content1 border border-default-200 rounded-xl overflow-hidden p-0"
      itemClasses={{
        base: 'border-0',
        title: 'font-bold text-foreground',
        trigger: 'px-6 py-4 hover:bg-content2 transition-colors duration-200',
        content: 'px-6 pb-6',
        indicator: 'text-default-400',
      }}
    >
      <AccordionItem title={title} key={accordionKey}>
        <Divider />
        {onSubmit ? (
          <Form onSubmit={onSubmit} validationErrors={validationErrors}>
            {body}
            {footer}
          </Form>
        ) : (
          <>
            {body}
            {footer}
          </>
        )}
        <BusyDialog isOpen={!!isLoading} />
      </AccordionItem>
    </Accordion>
  );
}
