'use client';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface BrowseQuestionsToolbarProps {
  readonly totalInLeaf: number;
  readonly loadedCount: number;
  readonly selectedCount: number;
  readonly allSelected: boolean;
  readonly isIndeterminate: boolean;
  readonly onToggleSelectAll: (checked: boolean) => void;
  readonly onBulkDelete: () => void;
}

export function BrowseQuestionsToolbar({
  totalInLeaf,
  loadedCount,
  selectedCount,
  allSelected,
  isIndeterminate,
  onToggleSelectAll,
  onBulkDelete,
}: BrowseQuestionsToolbarProps) {
  const { t } = useTranslation();
  const hasSelection = selectedCount > 0;

  if (loadedCount === 0) return null;

  // This toolbar is rendered inside the Accordion trigger header (which is a
  // native <button>). HTML doesn't allow nested <button> elements, so the
  // trash uses <div role="button"> instead of a HeroUI <Button>. All
  // interactive controls also stopPropagation so clicking them doesn't toggle
  // the parent accordion.
  return (
    <div
      className="flex items-center gap-2 flex-shrink-0"
      role="presentation"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Chip color="primary" size="sm" variant="flat">
        {totalInLeaf}
      </Chip>
      <Checkbox
        classNames={{ label: 'text-xs text-default-500' }}
        isIndeterminate={isIndeterminate}
        isSelected={allSelected}
        size="sm"
        onValueChange={onToggleSelectAll}
      >
        {t('common.selectAll')}
      </Checkbox>
      {hasSelection && renderBulkDelete()}
    </div>
  );

  function renderBulkDelete() {
    const label = t('browse.deleteSelected', { count: selectedCount });

    return (
      <div
        aria-label={label}
        className="h-9 w-9 grid place-items-center rounded-md cursor-pointer text-danger hover:bg-danger/10 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        role="button"
        tabIndex={0}
        title={label}
        onClick={onBulkDelete}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onBulkDelete();
          }
        }}
      >
        <FontAwesomeIcon className="h-3.5 w-3.5" icon={faTrash} />
      </div>
    );
  }
}
