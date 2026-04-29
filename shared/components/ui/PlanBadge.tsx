'use client';

import NextLink from 'next/link';
import { Chip } from '@heroui/chip';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { UserPlan } from '@/shared/types';

interface PlanBadgeProps {
  readonly plan: UserPlan;
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const { t } = useTranslation();

  return (
    <NextLink href="/billing">
      <Chip
        size="sm"
        variant="flat"
        classNames={{
          base: plan === 'pro'
            ? 'bg-secondary/10 border border-secondary/30 cursor-pointer'
            : 'bg-default-100 border border-default-200 cursor-pointer',
          content: plan === 'pro'
            ? 'text-secondary font-semibold text-xs'
            : 'text-default-500 font-semibold text-xs',
        }}
      >
        {plan === 'pro' ? t('billing.badge.pro') : t('billing.badge.free')}
      </Chip>
    </NextLink>
  );
}
