'use client';

import React from 'react';
import { Select, SelectItem } from '@heroui/select';
import { QUESTIONS_PER_PAGE_OPTIONS } from '@/config/constants';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface ItemsPerPageSelectProps {
  readonly value: number;
  readonly onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function ItemsPerPageSelect({ value, onChange }: ItemsPerPageSelectProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-2 ml-auto">
      <label htmlFor="questionsPerPage" className="text-sm font-bold">
        {t('common.questionsPerPage')}
      </label>
      <Select
        id="questionsPerPage"
        defaultSelectedKeys={QUESTIONS_PER_PAGE_OPTIONS[1].key}
        items={QUESTIONS_PER_PAGE_OPTIONS}
        value={String(value)}
        onChange={onChange}
        className="w-24 ml-auto"
        {...inputProperties.select}
      >
        {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
      </Select>
    </div>
  );
}
