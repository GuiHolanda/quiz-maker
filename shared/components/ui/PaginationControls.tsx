'use client';

import { Button } from '@heroui/button';
import { Pagination } from '@heroui/pagination';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface PaginationControlsProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly onChange: (page: number) => void;
}

export function PaginationControls({ currentPage, totalPages, onChange }: PaginationControlsProps) {
  const { t } = useTranslation();

  return (
    <>
      <Button
        color="primary"
        size="sm"
        variant="ghost"
        onPress={() => onChange(currentPage > 1 ? currentPage - 1 : currentPage)}
        isDisabled={currentPage === 1}
      >
        {t('common.previous')}
      </Button>
      <Pagination color="primary" page={currentPage} total={totalPages} onChange={onChange} />
      <Button
        color="primary"
        size="sm"
        variant="ghost"
        onPress={() => onChange(currentPage < totalPages ? currentPage + 1 : currentPage)}
        isDisabled={currentPage === totalPages}
      >
        {t('common.next')}
      </Button>
    </>
  );
}
