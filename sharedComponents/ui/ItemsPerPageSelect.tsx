'use client';

import React from 'react';
import { Select, SelectItem } from '@heroui/select';
import { QUESTIONS_PER_PAGE_OPTIONS } from '@/config/constants';

interface ItemsPerPageSelectProps {
  readonly value: number;
  readonly onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function ItemsPerPageSelect({ value, onChange }: ItemsPerPageSelectProps) {
  return (
    <div className="flex flex-col items-center gap-2 ml-auto">
      <label htmlFor="questionsPerPage" className="text-sm font-bold">
        Questions per page:
      </label>
      <Select
        id="questionsPerPage"
        defaultSelectedKeys={QUESTIONS_PER_PAGE_OPTIONS[1].key}
        items={QUESTIONS_PER_PAGE_OPTIONS}
        value={String(value)}
        onChange={onChange}
        className="w-24 ml-auto"
      >
        {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
      </Select>
    </div>
  );
}
