'use client';

import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface QuestionBankPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly shown: number;
  readonly filteredTotal: number;
  readonly onPageChange: (page: number) => void;
}

export function QuestionBankPagination({
  page,
  totalPages,
  shown,
  filteredTotal,
  onPageChange,
}: QuestionBankPaginationProps) {
  const { t } = useTranslation();

  const label = filteredTotal
    ? t('questionBank.paginationLabel', { page, totalPages, shown, total: filteredTotal })
    : t('questionBank.paginationEmpty');

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-xs text-default-400">{label}</span>
      <div className="flex gap-2">
        <Button
          className={`${buttonStyles.flat} h-9 px-4 text-sm`}
          isDisabled={page <= 1}
          size="sm"
          onPress={() => onPageChange(page - 1)}
        >
          {t('questionBank.prev')}
        </Button>
        <Button
          className={`${buttonStyles.flat} h-9 px-4 text-sm`}
          isDisabled={page >= totalPages}
          size="sm"
          onPress={() => onPageChange(page + 1)}
        >
          {t('questionBank.next')}
        </Button>
      </div>
    </div>
  );
}
