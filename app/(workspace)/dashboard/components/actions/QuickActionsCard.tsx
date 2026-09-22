'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faLayerGroup, faPenRuler, faRotateLeft, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardHome } from '@/shared/types';

interface QuickActionsCardProps {
  readonly counts: DashboardHome['quickActions'] | null;
}

export function QuickActionsCard({ counts }: QuickActionsCardProps) {
  const { t } = useTranslation();

  const actions: { icon: IconDefinition; label: string; note: string; href: string }[] = [
    {
      icon: faWandMagicSparkles,
      label: t('dashboard.home.actionGenerate'),
      note: t('dashboard.home.actionGenerateNote'),
      href: '/questions',
    },
    {
      icon: faPenRuler,
      label: t('dashboard.home.actionSimulado'),
      note: t('dashboard.home.actionSimuladoNote'),
      href: '/simulados',
    },
    {
      icon: faLayerGroup,
      label: t('dashboard.home.actionBank'),
      note: t('dashboard.home.actionBankNote', { count: counts ? counts.bankCount : 0 }),
      href: '/question-bank',
    },
    {
      icon: faRotateLeft,
      label: t('dashboard.home.actionReview'),
      note: t('dashboard.home.actionReviewNote', { count: counts ? counts.wrongOpenCount : 0 }),
      href: '/question-bank?situation=wrong',
    },
  ];

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6"
      data-testid="dashboard-quick-actions"
    >
      <p className="text-sm font-bold text-foreground">{t('dashboard.home.actionsTitle')}</p>
      <div className="mt-4 flex flex-col gap-2">
        {actions.map((action) => (
          <NextLink
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 rounded-lg bg-background border border-default-200 dark:border-transparent p-3 transition-colors hover:bg-content2"
          >
            <FontAwesomeIcon className="text-sm text-primary shrink-0" icon={action.icon} />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{action.label}</span>
              <span className="block mt-0.5 text-xs text-default-500">{action.note}</span>
            </span>
          </NextLink>
        ))}
      </div>
    </div>
  );
}
