'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import NextLink from 'next/link';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { buttonStyles } from '@/config/constants/buttonStyles';

interface ExamsEmptyStateProps {
  readonly type: 'certification' | 'public_exam';
  readonly icon: IconDefinition;
  readonly title: string;
  readonly description: string;
  readonly addHref: string;
  readonly addLabel: string;
}

export function ExamsEmptyState({ icon, title, description, addHref, addLabel }: ExamsEmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center gap-5 py-20 bg-content1 border border-dashed border-default-200 rounded-xl text-center px-6"
    >
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
        <FontAwesomeIcon className="text-primary" icon={icon} size="2x" />
      </div>
      <div className="flex flex-col gap-2 max-w-md">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-default-500">{description}</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <Button as={NextLink} className={buttonStyles.primary} href={addHref} startContent={<span>+</span>}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
