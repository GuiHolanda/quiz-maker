'use client';

import { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

type InlineAlertColor = 'primary' | 'success' | 'warning' | 'danger';
type InlineAlertVariant = 'subtle' | 'bordered';

interface InlineAlertProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: IconDefinition;
  readonly startContent?: ReactNode;
  readonly endContent?: ReactNode;
  readonly onDismiss?: () => void;
  readonly color?: InlineAlertColor;
  readonly variant?: InlineAlertVariant;
  readonly className?: string;
}

const CONTAINER_CLASSES: Record<InlineAlertColor, Record<InlineAlertVariant, string>> = {
  primary: {
    subtle: 'border border-primary-100 bg-primary-50/60 dark:bg-primary-900/20',
    bordered: 'border border-primary dark:bg-primary-900/20',
  },
  success: {
    subtle: 'border border-success-200 bg-success-50 dark:bg-success-900/20',
    bordered: 'border border-success dark:bg-success-900/20',
  },
  warning: {
    subtle: 'border border-warning-200 bg-warning-50/60 dark:bg-warning-900/20',
    bordered: 'border border-warning dark:bg-warning-900/20',
  },
  danger: {
    subtle: 'border border-danger-200 bg-danger-50/60 dark:bg-danger-900/20',
    bordered: 'border border-danger dark:bg-danger-900/20',
  },
};

const ICON_COLOR_CLASSES: Record<InlineAlertColor, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

const TITLE_COLOR_CLASSES: Record<InlineAlertColor, Record<InlineAlertVariant, string>> = {
  primary: { subtle: 'text-default-700', bordered: 'text-primary' },
  success: { subtle: 'text-default-700', bordered: 'text-success' },
  warning: { subtle: 'text-default-700', bordered: 'text-warning' },
  danger: { subtle: 'text-default-700', bordered: 'text-danger' },
};

export function InlineAlert({
  title,
  description,
  icon,
  startContent,
  endContent,
  onDismiss,
  color = 'primary',
  variant = 'subtle',
  className,
}: InlineAlertProps) {
  const { t } = useTranslation();
  const containerClass = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-none ${CONTAINER_CLASSES[color][variant]}${className ? ` ${className}` : ''}`;
  const iconColorClass = ICON_COLOR_CLASSES[color];
  const titleColorClass = TITLE_COLOR_CLASSES[color][variant];

  return (
    <div className={containerClass}>
      {startContent ?? (icon && <FontAwesomeIcon className={`${iconColorClass} shrink-0`} icon={icon} />)}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-snug ${titleColorClass}`}>{title}</p>
        {description && <p className="text-xs text-default-500 leading-snug">{description}</p>}
      </div>
      {endContent}
      {onDismiss && (
        <Button
          isIconOnly
          aria-label={t('common.dismiss')}
          className={`${buttonStyles.iconOnly.neutral} shrink-0`}
          size="sm"
          variant="light"
          onPress={onDismiss}
        >
          <FontAwesomeIcon icon={faXmark} />
        </Button>
      )}
    </div>
  );
}
