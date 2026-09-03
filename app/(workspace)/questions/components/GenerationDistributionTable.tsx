'use client';

import { Button } from '@heroui/button';
import { NumberInput } from '@heroui/number-input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

import type { DistributionRow } from './useGenerationDistribution.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { ProgressTrack } from '@/shared/components/ui/ProgressTrack';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface GenerationDistributionTableProps {
  readonly rows: ReadonlyArray<DistributionRow>;
  readonly isModified: boolean;
  readonly onCountChange: (name: string, value: number) => void;
  readonly onRemove: (name: string) => void;
  readonly onRedistribute: () => void;
}

export function GenerationDistributionTable({
  rows,
  isModified,
  onCountChange,
  onRemove,
  onRedistribute,
}: GenerationDistributionTableProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-default-200 dark:border-transparent bg-content1 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-base font-bold tracking-tight text-foreground">{t('generate.distributionTitle')}</span>
          <span className="text-[13.5px] leading-snug text-default-500">{t('generate.distributionSubtitle')}</span>
        </div>
        {isModified && (
          <Button
            className={`${buttonStyles.secondarySm} shrink-0`}
            size="sm"
            startContent={<FontAwesomeIcon className="h-3 w-3" icon={faRotateLeft} />}
            variant="bordered"
            onPress={onRedistribute}
          >
            {t('generate.redistribute')}
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-divider px-4 py-3 text-xs text-default-400">
          {t('generate.noTopicsLeft')}
        </p>
      ) : (
        <div className="rounded-lg border border-divider">
          {rows.map((row) => (
            <div
              key={row.name}
              className="flex items-start gap-3 border-t border-divider px-4 py-3.5 first:border-t-0 sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-medium leading-snug text-foreground sm:truncate">{row.name}</p>
                <ProgressTrack className="mt-2" heightClass="h-[3px]" trackClass="bg-content2" value={row.barPercent} />
                <span className="mt-1.5 block font-mono text-[11.5px] text-default-400 sm:hidden">
                  {t('generate.topicWeight', { weight: row.weight })}
                </span>
              </div>

              <span className="hidden shrink-0 font-mono text-[11.5px] text-default-400 sm:block">
                {t('generate.topicWeight', { weight: row.weight })}
              </span>

              <NumberInput
                aria-label={t('simulado.topicQuestionCountLabel', { topic: row.name })}
                className="w-[72px] shrink-0"
                classNames={{
                  inputWrapper: 'h-9 bg-background border-divider',
                  input: 'text-center font-mono text-sm',
                }}
                hideStepper
                minValue={0}
                size="sm"
                value={row.count}
                variant="bordered"
                onValueChange={(value) =>
                  queueMicrotask(() => onCountChange(row.name, Number.isFinite(value) ? value : 0))
                }
              />

              <Button
                isIconOnly
                aria-label={t('generate.removeTopic', { topic: row.name })}
                className={`${buttonStyles.iconOnly.danger} shrink-0`}
                size="sm"
                variant="light"
                onPress={() => onRemove(row.name)}
              >
                <FontAwesomeIcon className="h-[15px] w-[15px]" icon={faTrash} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
