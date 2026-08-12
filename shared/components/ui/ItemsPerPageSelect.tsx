'use client';

import React from 'react';
import { Select, SelectItem } from '@heroui/select';

import { QUESTIONS_PER_PAGE_OPTIONS } from '@/config/constants';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface ItemsPerPageSelectProps {
  readonly value: number;
  readonly onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  readonly isDisabled?: boolean;
}

export function ItemsPerPageSelect({ value, onChange, isDisabled }: ItemsPerPageSelectProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-end gap-2 ml-auto">
      <label className="text-xs text-default-500 font-semibold pb-0.5" htmlFor="questionsPerPage">
        {t('common.questionsPerPage')}
      </label>
      <Select
        className="w-24 ml-auto"
        id="questionsPerPage"
        isDisabled={isDisabled}
        items={QUESTIONS_PER_PAGE_OPTIONS}
        selectedKeys={[String(value)]}
        onChange={onChange}
        {...inputProperties.select}
        size="sm"
        classNames={{
          ...inputProperties.select.classNames,
          trigger: inputProperties.select.classNames.trigger.replace('h-11', '').trim(),
        }}
      >
        {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
      </Select>
    </div>
  );
}
