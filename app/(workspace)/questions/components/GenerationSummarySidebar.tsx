'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

export interface SummaryRow {
  readonly label: string;
  readonly value: string;
  readonly highlight?: boolean;
}

export type SidebarAction =
  | {
      readonly kind: 'config';
      readonly statusText: string;
      readonly statusTone: 'ok' | 'warn';
      readonly hasSurplus: boolean;
      readonly canGenerate: boolean;
      readonly isBusy: boolean;
      readonly onAutoAdjust: () => void;
      readonly onGenerate: () => void;
    }
  | { readonly kind: 'running'; readonly footnote: string; readonly onCancel: () => void }
  | {
      readonly kind: 'review';
      readonly footnote: string;
      readonly isSaving: boolean;
      readonly onReview: () => void;
      readonly onSaveAll: () => void;
      readonly onDiscard: () => void;
    };

interface GenerationSummarySidebarProps {
  readonly rows: ReadonlyArray<SummaryRow>;
  readonly action: SidebarAction;
}

const STATUS_OK = 'border-success/30 bg-success/10 text-success';
const STATUS_WARN = 'border-primary/35 bg-primary/10 text-primary';
const GHOST_BTN =
  'rounded-lg border-divider text-default-500 data-[hover=true]:bg-content2 data-[hover=true]:text-foreground';
const GHOST_DANGER_BTN = 'rounded-lg border-danger/40 text-danger data-[hover=true]:bg-danger/10';

export function GenerationSummarySidebar({ rows, action }: GenerationSummarySidebarProps) {
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

        {action.kind === 'config' && renderConfigAction(action)}
        {action.kind === 'running' && (
          <div className="mt-2 flex flex-col gap-3">
            <p className="text-[13px] leading-relaxed text-default-400">{action.footnote}</p>
            <Button
              className={`${GHOST_DANGER_BTN} w-full`}
              data-testid="question-gen-job-cancel-btn"
              variant="bordered"
              onPress={action.onCancel}
            >
              {t('common.cancel')}
            </Button>
          </div>
        )}
        {action.kind === 'review' && (
          <div className="mt-2 flex flex-col gap-3">
            <p className="text-[13px] leading-relaxed text-default-400">{action.footnote}</p>
            <div className="flex flex-col gap-2.5">
              <Button
                className={`${buttonStyles.primary} w-full`}
                endContent={<FontAwesomeIcon icon={faArrowRight} />}
                onPress={action.onReview}
              >
                {t('generate.reviewQuestions')}
              </Button>
              <Button
                className={`${GHOST_BTN} w-full`}
                data-testid="question-gen-save-all-btn"
                isLoading={action.isSaving}
                variant="bordered"
                onPress={action.onSaveAll}
              >
                {t('generate.saveAll')}
              </Button>
              <Button className={`${GHOST_DANGER_BTN} w-full`} variant="bordered" onPress={action.onDiscard}>
                {t('common.discard')}
              </Button>
            </div>
          </div>
        )}
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

  function renderConfigAction(cfg: Extract<SidebarAction, { kind: 'config' }>) {
    return (
      <div className="mt-2 flex flex-col gap-2.5">
        <span
          className={`self-start rounded-full border px-3 py-1.5 font-mono text-xs ${
            cfg.statusTone === 'ok' ? STATUS_OK : STATUS_WARN
          }`}
        >
          {cfg.statusText}
        </span>

        {cfg.hasSurplus && (
          <Button
            className={`${GHOST_BTN} h-8 self-start px-3 text-xs`}
            size="sm"
            variant="bordered"
            onPress={cfg.onAutoAdjust}
          >
            {t('generate.autoAdjust')}
          </Button>
        )}

        <Button
          className={`${buttonStyles.primary} w-full`}
          data-testid="question-gen-generate-btn"
          isDisabled={!cfg.canGenerate}
          isLoading={cfg.isBusy}
          startContent={<FontAwesomeIcon icon={faWandMagicSparkles} />}
          onPress={cfg.onGenerate}
        >
          {t('generate.generateButton')}
        </Button>
      </div>
    );
  }
}
