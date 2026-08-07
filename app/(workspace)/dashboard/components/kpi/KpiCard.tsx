'use client';

import { Chip } from '@heroui/chip';

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
    <div className={`bg-content1 border border-default-200 rounded-xl p-5 ${comingSoon ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        {icon}
        {comingSoon ? (
          <Chip color="default" size="sm" variant="flat">
            {t('dashboard.comingSoon')}
          </Chip>
        ) : (
          badge
        )}
      </div>
      <p className="font-bold text-foreground text-2xl leading-none mb-1">{comingSoon ? '-' : value}</p>
      <p className="text-xs text-default-400">{label}</p>
      <p className="font-mono text-[9px] text-default-400 mt-1">{detail}</p>
    </div>
  );
}
