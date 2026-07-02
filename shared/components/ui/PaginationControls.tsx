'use client';

import { Button } from '@heroui/button';
import { Pagination } from '@heroui/pagination';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

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
        className={buttonStyles.secondary}
        isDisabled={currentPage === 1}
        size="sm"
        variant="bordered"
        onPress={() => onChange(currentPage > 1 ? currentPage - 1 : currentPage)}
      >
        {t('common.previous')}
      </Button>
      <Pagination color="primary" page={currentPage} total={totalPages} onChange={onChange} />
      <Button
        className={buttonStyles.secondary}
        isDisabled={currentPage === totalPages}
        size="sm"
        variant="bordered"
        onPress={() => onChange(currentPage < totalPages ? currentPage + 1 : currentPage)}
      >
        {t('common.next')}
      </Button>
    </>
  );
}
