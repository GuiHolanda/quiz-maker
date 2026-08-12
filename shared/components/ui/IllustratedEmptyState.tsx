'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import NextLink from 'next/link';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { buttonStyles } from '@/config/constants/buttonStyles';

interface IllustratedEmptyStateAction {
  readonly label: string;
  readonly href?: string;
  readonly onPress?: () => void;
}

interface IllustratedEmptyStateProps {
  readonly icon: IconDefinition;
  readonly title: string;
  readonly description: string;
  readonly action?: IllustratedEmptyStateAction;
  readonly secondaryAction?: IllustratedEmptyStateAction;
}

export function IllustratedEmptyState({ icon, title, description, action, secondaryAction }: IllustratedEmptyStateProps) {
  return (
    <div
      data-testid="illustrated-empty-state"
      className="flex flex-col items-center justify-center gap-5 py-20 bg-content1 border border-dashed border-default-200 rounded-xl text-center px-6"
    >
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
        <FontAwesomeIcon className="text-primary" icon={icon} size="2x" />
      </div>
      <div className="flex flex-col gap-2 max-w-2xl">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-default-500">{description}</p>
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && (
            <Button
              as={action.href ? NextLink : undefined}
              className={buttonStyles.primary}
              href={action.href}
              startContent={<span>+</span>}
              onPress={action.onPress}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              as={secondaryAction.href ? NextLink : undefined}
              className={buttonStyles.secondary}
              href={secondaryAction.href}
              variant="bordered"
              onPress={secondaryAction.onPress}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
