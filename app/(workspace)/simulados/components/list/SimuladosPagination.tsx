'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface SimuladosPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly pageNumbers: number[];
  readonly from: number;
  readonly to: number;
  readonly total: number;
  readonly onPage: (page: number) => void;
}

const PAGE_BTN_BASE = 'h-9 min-w-9 rounded-lg border bg-transparent px-3 font-mono text-xs';
const PAGE_BTN_ACTIVE = 'border-primary bg-primary/10 text-primary';
const PAGE_BTN_IDLE = 'border-divider text-default-500 data-[hover=true]:bg-content2 data-[hover=true]:text-foreground';

export function SimuladosPagination({
  page,
  totalPages,
  pageNumbers,
  from,
  to,
  total,
  onPage,
}: SimuladosPaginationProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
      <p className="text-xs text-default-400">
        {t('simulado.table.count', { from, to, total, page, pages: totalPages })}
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          className={`${PAGE_BTN_BASE} ${PAGE_BTN_IDLE}`}
          data-testid="simulado-pagination-prev"
          isDisabled={page <= 1}
          size="sm"
          startContent={<FontAwesomeIcon icon={faChevronLeft} />}
          variant="bordered"
          onPress={() => onPage(page - 1)}
        >
          {t('simulado.table.prev')}
        </Button>

        {pageNumbers.map((pageNumber) => (
          <Button
            key={pageNumber}
            className={`${PAGE_BTN_BASE} ${pageNumber === page ? PAGE_BTN_ACTIVE : PAGE_BTN_IDLE}`}
            size="sm"
            variant="bordered"
            onPress={() => onPage(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}

        <Button
          className={`${PAGE_BTN_BASE} ${PAGE_BTN_IDLE}`}
          data-testid="simulado-pagination-next"
          endContent={<FontAwesomeIcon icon={faChevronRight} />}
          isDisabled={page >= totalPages}
          size="sm"
          variant="bordered"
          onPress={() => onPage(page + 1)}
        >
          {t('simulado.table.next')}
        </Button>
      </div>
    </div>
  );
}
