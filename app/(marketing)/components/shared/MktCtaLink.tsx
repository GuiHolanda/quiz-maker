'use client';

import type { ReactNode } from 'react';
import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type MktCtaVariant = 'primary' | 'secondary';
type MktCtaSize = 'md' | 'lg';

interface MktCtaLinkProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly variant?: MktCtaVariant;
  readonly size?: MktCtaSize;
  readonly icon?: IconDefinition;
  readonly className?: string;
}

const VARIANT_CLASSES: Record<MktCtaVariant, string> = {
  primary: 'font-semibold bg-mkt-accent text-white hover:opacity-90',
  secondary: 'font-medium border border-mkt-divider text-mkt-text opacity-70 hover:opacity-100',
};

const SIZE_CLASSES: Record<MktCtaSize, string> = {
  md: 'px-6 py-3',
  lg: 'px-8 py-3.5',
};

export function MktCtaLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
}: MktCtaLinkProps) {
  const gap = icon ? 'gap-2' : '';
  const classes =
    `inline-flex items-center justify-center text-sm transition-opacity ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${gap} ${className}`
      .replace(/\s+/g, ' ')
      .trim();

  return (
    <NextLink className={classes} href={href}>
      {children}
      {icon && <FontAwesomeIcon className="text-xs" icon={icon} />}
    </NextLink>
  );
}
