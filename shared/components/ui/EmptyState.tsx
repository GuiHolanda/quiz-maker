'use client';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

interface EmptyStateAction {
  readonly label: string;
  readonly href?: string;
  readonly onPress?: () => void;
  readonly icon?: IconDefinition;
}

interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: EmptyStateAction;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 bg-content1 border border-default-200 rounded-xl text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && <p className="text-sm text-default-500 max-w-sm">{description}</p>}
      {action && renderAction()}
    </div>
  );

  function renderAction() {
    if (!action) return null;
    const icon = <FontAwesomeIcon className="w-3.5 h-3.5" icon={action.icon ?? faPlus} />;
    const className =
      'bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 mt-2';

    if (action.href) {
      return (
        <Button as={NextLink} className={className} href={action.href} startContent={icon}>
          {action.label}
        </Button>
      );
    }

    return (
      <Button className={className} startContent={icon} onPress={action.onPress}>
        {action.label}
      </Button>
    );
  }
}
