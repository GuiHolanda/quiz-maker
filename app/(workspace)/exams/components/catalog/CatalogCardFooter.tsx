'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { CatalogExam } from '@/shared/types';

interface CatalogCardFooterProps {
  readonly exam: CatalogExam;
  readonly isForking: boolean;
  readonly onFork: () => void;
}

export function CatalogCardFooter({ exam, isForking, onFork }: CatalogCardFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      {exam.poolQuestionCount > 0 && (
        <Chip color="success" data-testid="catalog-pool-chip" size="sm" variant="flat">
          {t('catalog.poolCount', { count: String(exam.poolQuestionCount) })}
        </Chip>
      )}
      <Button
        className={buttonStyles.primary}
        data-testid="catalog-fork-btn"
        isLoading={isForking}
        startContent={!isForking ? <FontAwesomeIcon icon={faUserPlus} /> : undefined}
        onPress={onFork}
      >
        {t('catalog.useTemplate')}
      </Button>
    </div>
  );
}
