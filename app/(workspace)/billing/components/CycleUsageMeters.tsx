'use client';

import { ProgressTrack } from '@/shared/components/ui/ProgressTrack';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { formatCount } from '@/app/(workspace)/billing/components/billingFormat';

interface Meter {
  readonly label: string;
  readonly used: number;
  readonly limit: number;
  readonly note: string;
}

interface CycleUsageMetersProps {
  readonly meters: readonly Meter[];
}

function fillClass(pct: number): string {
  if (pct >= 90) return 'bg-danger';
  if (pct >= 70) return 'bg-warning';
  return 'bg-primary';
}

export function CycleUsageMeters({ meters }: CycleUsageMetersProps) {
  const { t, language } = useTranslation();

  return (
    <div className="flex flex-col gap-5">
      {meters.map((meter) => {
        const unlimited = meter.limit === -1;
        const pct = unlimited ? 0 : Math.min(100, Math.round((meter.used / meter.limit) * 100));
        const valueLabel = unlimited
          ? `${formatCount(meter.used, language)} / ${t('billing.unlimited')}`
          : `${formatCount(meter.used, language)} / ${formatCount(meter.limit, language)}`;

        return (
          <div key={meter.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-foreground">{meter.label}</span>
              <span className={`font-mono text-[13px] ${pct >= 90 && !unlimited ? 'text-danger' : 'text-foreground'}`}>
                {valueLabel}
              </span>
            </div>
            <ProgressTrack
              animated
              className="mt-2"
              fillClass={unlimited ? 'bg-primary/40' : fillClass(pct)}
              heightClass="h-1.5"
              trackClass="bg-background"
              value={unlimited ? 100 : pct}
            />
            <p className="mt-1.5 text-xs text-default-400">{meter.note}</p>
          </div>
        );
      })}
    </div>
  );
}
