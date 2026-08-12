'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDownWideShort, faArrowUpWideShort, faSliders } from '@fortawesome/free-solid-svg-icons';
import type { ReactNode } from 'react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface CollapsibleFilterPanelProps {
  readonly isOpen: boolean;
  readonly hasActiveFilters: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
  readonly sort?: 'asc' | 'desc';
  readonly onToggleSort?: () => void;
  readonly sortAscLabel?: string;
  readonly sortDescLabel?: string;
}

export function CollapsibleFilterPanel({
  isOpen,
  hasActiveFilters,
  onToggle,
  children,
  sort,
  onToggleSort,
  sortAscLabel,
  sortDescLabel,
}: CollapsibleFilterPanelProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {sort !== undefined && onToggleSort && (
          <Button
            isIconOnly
            aria-label={sort === 'desc' ? sortDescLabel : sortAscLabel}
            className={buttonStyles.flat}
            size="sm"
            onPress={onToggleSort}
          >
            <FontAwesomeIcon
              className="w-3.5 h-3.5"
              icon={sort === 'desc' ? faArrowDownWideShort : faArrowUpWideShort}
            />
          </Button>
        )}
        <Badge color="danger" content="" isInvisible={!hasActiveFilters} shape="circle" size="sm">
          <Button
            aria-label={t('common.filters')}
            className={buttonStyles.flat}
            data-testid="filter-panel-toggle"
            size="sm"
            startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faSliders} />}
            onPress={onToggle}
          >
            {t('common.filters')}
          </Button>
        </Badge>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="filter-panel"
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden basis-full"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
