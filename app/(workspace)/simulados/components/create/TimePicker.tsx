'use client';

import type { TimeMode } from './simuladoFormState';

import { Button } from '@heroui/button';
import { Input } from '@heroui/input';

import { FieldLabel } from '@/shared/components/ui/FieldLabel';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface TimePickerProps {
  readonly mode: TimeMode;
  readonly officialLabel: string;
  readonly customMinutes: number;
  readonly onMode: (mode: TimeMode) => void;
  readonly onCustomMinutes: (minutes: number) => void;
}

const PILL_BASE = 'h-auto rounded-full border bg-transparent px-4 py-2.5 text-sm font-medium';
const PILL_ACTIVE = 'border-primary bg-primary/10 text-primary';
const PILL_IDLE = 'border-divider text-default-500 data-[hover=true]:text-foreground';

const minutesInputClassNames = {
  ...inputProperties.input.classNames,
  input: `${inputProperties.input.classNames.input} text-center font-mono`,
};

export function TimePicker({ mode, officialLabel, customMinutes, onMode, onCustomMinutes }: TimePickerProps) {
  const { t } = useTranslation();

  const options: { key: TimeMode; label: string; testId: string }[] = [
    { key: 'oficial', label: officialLabel, testId: 'simulado-time-oficial' },
    { key: 'livre', label: t('simulado.create.timeFree'), testId: 'simulado-time-livre' },
    { key: 'personalizado', label: t('simulado.create.timeCustom'), testId: 'simulado-time-personalizado' },
  ];

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{t('simulado.create.timeLabel')}</FieldLabel>
      <div className="flex flex-wrap items-center gap-2.5">
        {options.map((option) => (
          <Button
            key={option.key}
            aria-pressed={mode === option.key}
            className={`${PILL_BASE} ${mode === option.key ? PILL_ACTIVE : PILL_IDLE}`}
            data-testid={option.testId}
            size="sm"
            variant="bordered"
            onPress={() => onMode(option.key)}
          >
            {option.label}
          </Button>
        ))}

        {mode === 'personalizado' && (
          <span className="flex items-center gap-2">
            <Input
              {...inputProperties.input}
              aria-label={t('simulado.create.minutes')}
              className="w-[88px]"
              classNames={minutesInputClassNames}
              data-testid="simulado-custom-minutes-input"
              min={1}
              placeholder=" "
              type="number"
              value={customMinutes > 0 ? String(customMinutes) : ''}
              onValueChange={(value) => onCustomMinutes(Number(value) || 0)}
            />
            <span className="text-sm text-default-500">{t('simulado.create.minutes')}</span>
          </span>
        )}
      </div>
    </div>
  );
}
