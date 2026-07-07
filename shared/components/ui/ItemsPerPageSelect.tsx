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
    <div className="flex flex-col items-center gap-2 ml-auto">
      <label className="text-xs font-bold" htmlFor="questionsPerPage">
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
      >
        {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
      </Select>
    </div>
  );
}
