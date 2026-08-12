'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faChevronDown } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { CatalogExam } from '@/shared/types';

interface CatalogCardFooterProps {
  readonly exam: CatalogExam;
  readonly isSelected: boolean;
  readonly isForking: boolean;
  readonly onToggleDetails: () => void;
  readonly onFork: () => void;
}

export function CatalogCardFooter({ exam, isSelected, isForking, onToggleDetails, onFork }: CatalogCardFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      {exam.poolQuestionCount > 0 && (
        <Chip color="success" data-testid="catalog-pool-chip" size="sm" variant="flat">
          {t('catalog.poolCount', { count: String(exam.poolQuestionCount) })}
        </Chip>
      )}
      <Button
        className={buttonStyles.flat}
        size="sm"
        startContent={
          <FontAwesomeIcon
            className={`transition-transform duration-150 ${isSelected ? 'rotate-180' : ''}`}
            icon={faChevronDown}
          />
        }
        onPress={onToggleDetails}
      >
        {t('common.viewDetails')}
      </Button>
      <Button
        className={buttonStyles.primarySm}
        data-testid="catalog-fork-btn"
        isLoading={isForking}
        size="sm"
        startContent={!isForking ? <FontAwesomeIcon icon={faUserPlus} /> : undefined}
        onPress={onFork}
      >
        {t('catalog.useTemplate')}
      </Button>
    </div>
  );
}
