'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlay } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { FieldLabel } from '@/shared/components/ui/FieldLabel';
import { KeyValueList, type KeyValueRow } from '@/shared/components/ui/KeyValueList';
import { StatusPill } from '@/shared/components/ui/StatusPill';

interface SummarySidebarProps {
  readonly rows: ReadonlyArray<KeyValueRow>;
  readonly statusText: string;
  readonly statusTone: 'ok' | 'warn';
  readonly canCreate: boolean;
  readonly isBusy: boolean;
  readonly onCreate: () => void;
  readonly notes: string[];
  readonly footnote?: string;
}

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
      <div className="flex flex-col gap-3 rounded-xl border border-default-200 dark:border-transparent bg-content1 p-6">
        <FieldLabel>{t('simulado.create.summary')}</FieldLabel>

        <KeyValueList rows={rows} />

        {footnote ? (
          <p className="mt-2 text-[13px] leading-relaxed text-default-400" data-testid="simulado-create-footnote">
            {footnote}
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-2.5">
            <StatusPill
              className="self-start"
              data-testid="simulado-create-status"
              tone={statusTone === 'ok' ? 'ok' : 'busy'}
            >
              {statusText}
            </StatusPill>

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

      <div className="flex flex-col gap-3 rounded-xl border border-default-200 dark:border-transparent bg-content1 p-5">
        <FieldLabel>{t('simulado.create.aboutFormat')}</FieldLabel>
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
