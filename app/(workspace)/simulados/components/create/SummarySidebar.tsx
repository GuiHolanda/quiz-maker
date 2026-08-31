'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlay } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface SummaryRow {
  readonly label: string;
  readonly value: string;
  readonly highlight?: boolean;
}

interface SummarySidebarProps {
  readonly rows: SummaryRow[];
  readonly statusText: string;
  readonly statusTone: 'ok' | 'warn';
  readonly canCreate: boolean;
  readonly isBusy: boolean;
  readonly onCreate: () => void;
  readonly notes: string[];
  readonly footnote?: string;
}

const STATUS_OK = 'border-success/30 bg-success/10 text-success';
const STATUS_WARN = 'border-primary/35 bg-primary/10 text-primary';

export function SummarySidebar({
  rows,
  statusText,
  statusTone,
  canCreate,
  isBusy,
  onCreate,
  notes,
  footnote,
}: SummarySidebarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-4">
      <div className="flex flex-col gap-3 rounded-xl bg-content1 p-6">
        <span className="text-xs font-semibold text-default-400">{t('simulado.create.summary')}</span>

        <div className="flex flex-col">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 border-t border-divider py-2.5 first:border-t-0"
            >
              <span className="text-sm text-default-500">{row.label}</span>
              <span className={`text-sm font-semibold ${row.highlight ? 'text-primary' : 'text-foreground'}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {footnote ? (
          <p className="mt-2 text-[13px] leading-relaxed text-default-400" data-testid="simulado-create-footnote">
            {footnote}
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-2.5">
            <span
              className={`self-start rounded-full border px-3 py-1.5 font-mono text-xs ${
                statusTone === 'ok' ? STATUS_OK : STATUS_WARN
              }`}
              data-testid="simulado-create-status"
            >
              {statusText}
            </span>

            <Button
              className={`${buttonStyles.primary} w-full`}
              data-testid="simulado-create-btn"
              isDisabled={!canCreate}
              isLoading={isBusy}
              startContent={<FontAwesomeIcon icon={faPlay} />}
              onPress={onCreate}
            >
              {t('simulado.create.createButton')}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-content1 p-5">
        <span className="text-xs font-semibold text-default-400">{t('simulado.create.aboutFormat')}</span>
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <div key={note} className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-2.5">
              <FontAwesomeIcon className="mt-1 h-3.5 w-3.5 text-primary" icon={faCheck} />
              <span className="text-sm text-default-500">{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
