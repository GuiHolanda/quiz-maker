'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { ProgressTrack } from '@/shared/components/ui/ProgressTrack';

interface AttemptProgressCardProps {
  readonly answeredCount: number;
  readonly total: number;
  readonly progressPercent: number;
  readonly elapsedLabel: string;
  readonly timed: boolean;
  readonly remainingLabel: string;
  readonly perQuestionLabel: string;
  readonly critical: boolean;
  readonly onFinish: () => void;
}

export function AttemptProgressCard({
  answeredCount,
  total,
  progressPercent,
  elapsedLabel,
  timed,
  remainingLabel,
  perQuestionLabel,
  critical,
  onFinish,
}: AttemptProgressCardProps) {
  const { t } = useTranslation();

  const rows: { label: string; value: string; tone: string }[] = [
    { label: t('simulado.attempt.elapsed'), value: elapsedLabel, tone: 'text-default-600' },
  ];
  if (timed) {
    rows.push({
      label: t('simulado.attempt.remaining'),
      value: remainingLabel,
      tone: critical ? 'text-danger' : 'text-default-600',
    });
    rows.push({ label: t('simulado.attempt.perQuestion'), value: perQuestionLabel, tone: 'text-default-600' });
  }

  return (
    <div className="rounded-xl border border-divider bg-content1 p-5">
      <span className="text-xs font-semibold text-default-400">{t('simulado.attempt.progressHeading')}</span>

      <div className="mt-3.5 flex items-baseline gap-2.5">
        <span className="font-mono text-3xl font-medium tracking-tight text-foreground">{answeredCount}</span>
        <span className="text-sm text-default-500">{t('simulado.attempt.answeredOfTotal', { total })}</span>
      </div>

      <ProgressTrack
        animated
        className="mt-3.5"
        heightClass="h-[5px]"
        trackClass="bg-content2"
        value={progressPercent}
      />

      <div className="mt-4 flex flex-col">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-t border-divider py-2.5 first:border-t-0"
          >
            <span className="text-[13px] text-default-500">{row.label}</span>
            <span className={`font-mono text-[13px] ${row.tone}`}>{row.value}</span>
          </div>
        ))}
      </div>

      <Button
        className={`${buttonStyles.primary} mt-4 w-full`}
        data-testid="attempt-finalize-btn"
        startContent={<FontAwesomeIcon icon={faFlag} />}
        onPress={onFinish}
      >
        {t('simulado.finalize')}
      </Button>
      <p className="mt-3 text-xs leading-snug text-default-400 text-pretty">{t('simulado.attempt.gabaritoNote')}</p>
    </div>
  );
}
