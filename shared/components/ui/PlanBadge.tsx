'use client';

import type { UserPlan } from '@/shared/types';

import NextLink from 'next/link';
import { Chip } from '@heroui/chip';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface PlanBadgeProps {
  readonly plan: UserPlan;
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const { t } = useTranslation();

  const isPaid = plan === 'pro' || plan === 'pro_ai';

  return (
    <NextLink href="/billing">
      <Chip
        classNames={{
          base: isPaid
            ? 'bg-secondary/10 border border-secondary/30 cursor-pointer'
            : 'bg-default-100 border border-default-200 cursor-pointer',
          content: isPaid ? 'text-secondary font-semibold text-xs' : 'text-default-500 font-semibold text-xs',
        }}
        size="sm"
        variant="flat"
      >
        {plan === 'pro_ai' ? t('billing.badge.proAi') : isPaid ? t('billing.badge.pro') : t('billing.badge.free')}
      </Chip>
    </NextLink>
  );
}
