'use client';

import { Chip } from '@heroui/chip';

import { StatCard } from '@/shared/components/ui/StatCard';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface KpiCardProps {
  readonly icon: React.ReactNode;
  readonly badge: React.ReactNode;
  readonly value: string;
  readonly label: string;
  readonly detail: string;
  readonly comingSoon?: boolean;
}

export function KpiCard({ icon, badge, value, label, detail, comingSoon = false }: KpiCardProps) {
  const { t } = useTranslation();

  return (
    <StatCard
      icon={icon}
      label={label}
      detail={detail}
      value={comingSoon ? '-' : value}
      muted={comingSoon}
      action={
        comingSoon ? (
          <Chip color="default" size="sm" variant="flat">
            {t('dashboard.comingSoon')}
          </Chip>
        ) : (
          badge
        )
      }
    />
  );
}
