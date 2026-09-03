'use client';

import { Select, SelectItem } from '@heroui/select';

import { inputProperties } from '@/config/constants/inputStyles';

const compactTrigger = inputProperties.select.classNames.trigger.replace('h-11', '').trim();

interface SortSelectProps {
  readonly label: string;
  readonly options: ReadonlyArray<{ readonly key: string; readonly label: string }>;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly className?: string;
  readonly testId?: string;
}

export function SortSelect({ label, options, value, onChange, className = 'w-44', testId }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-default-500">{label}</span>
      <Select
        {...inputProperties.select}
        aria-label={label}
        className={className}
        data-testid={testId}
        disallowEmptySelection
        selectedKeys={new Set([value])}
        size="sm"
        classNames={{ ...inputProperties.select.classNames, trigger: compactTrigger }}
        onSelectionChange={(keys) => onChange(String(Array.from(keys)[0] ?? value))}
      >
        {options.map((option) => (
          <SelectItem key={option.key}>{option.label}</SelectItem>
        ))}
      </Select>
    </div>
  );
}
