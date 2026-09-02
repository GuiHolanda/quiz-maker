'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { StatusPill } from '@/shared/components/ui/StatusPill';

export interface SummaryRow {
  readonly label: string;
  readonly value: string;
  readonly highlight?: boolean;
}

interface GenerationSummarySidebarProps {
  readonly rows: ReadonlyArray<SummaryRow>;
  readonly statusText: string;
  readonly statusTone: 'ok' | 'warn';
  readonly hasSurplus: boolean;
  readonly canGenerate: boolean;
  readonly isBusy: boolean;
  readonly onAutoAdjust: () => void;
  readonly onGenerate: () => void;
}

const GHOST_BTN =
  'rounded-lg border-divider text-default-500 data-[hover=true]:bg-content2 data-[hover=true]:text-foreground';

export function GenerationSummarySidebar({
  rows,
  statusText,
  statusTone,
  hasSurplus,
  canGenerate,
  isBusy,
  onAutoAdjust,
  onGenerate,
}: GenerationSummarySidebarProps) {
  const { t } = useTranslation();

  const calibration = [t('generate.aiCalibration1'), t('generate.aiCalibration2'), t('generate.aiCalibration3')];

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-6">
      <div className="flex flex-col gap-3 rounded-xl bg-content1 p-6">
        <span className="text-xs font-semibold text-default-400">{t('generate.batchSummary')}</span>

        <div className="flex flex-col">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 border-t border-divider py-2.5 first:border-t-0"
            >
              <span className="shrink-0 text-[13.5px] text-default-500">{row.label}</span>
              <span
                className={`text-right text-sm font-semibold ${row.highlight ? 'text-primary' : 'text-foreground'}`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-col gap-2.5">
          <StatusPill className="self-start" tone={statusTone === 'ok' ? 'ok' : 'busy'}>
            {statusText}
          </StatusPill>

          {hasSurplus && (
            <Button
              className={`${GHOST_BTN} h-8 self-start px-3 text-xs`}
              size="sm"
              variant="bordered"
              onPress={onAutoAdjust}
            >
              {t('generate.autoAdjust')}
            </Button>
          )}

          <Button
            className={`${buttonStyles.primary} w-full`}
            data-testid="question-gen-generate-btn"
            isDisabled={!canGenerate}
            isLoading={isBusy}
            startContent={<FontAwesomeIcon icon={faWandMagicSparkles} />}
            onPress={onGenerate}
          >
            {t('generate.generateButton')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 rounded-xl bg-content1 p-5">
        <span className="text-xs font-semibold text-default-400">{t('generate.aiCalibrationTitle')}</span>
        <div className="flex flex-col gap-3">
          {calibration.map((line) => (
            <div key={line} className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-2.5">
              <FontAwesomeIcon className="mt-0.5 h-3.5 w-3.5 text-primary" icon={faCheck} />
              <span className="text-[13.5px] leading-snug text-default-500">{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
