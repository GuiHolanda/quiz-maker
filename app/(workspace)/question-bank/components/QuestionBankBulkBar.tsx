'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck, faTrash } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface QuestionBankBulkBarProps {
  readonly count: number;
  readonly canCreateSimulado: boolean;
  readonly onCreateSimulado: () => void;
  readonly onBulkDelete: () => void;
}

export function QuestionBankBulkBar({
  count,
  canCreateSimulado,
  onCreateSimulado,
  onBulkDelete,
}: QuestionBankBulkBarProps) {
  const { t } = useTranslation();

  const label = count === 1 ? t('questionBank.selectionOne', { count }) : t('questionBank.selectionMany', { count });

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.07] p-4"
      data-testid="question-bank-bulk-bar"
    >
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {!canCreateSimulado && <span className="text-xs text-default-500">{t('questionBank.bulkSingleExamHint')}</span>}
        <Button
          className={buttonStyles.primary}
          data-testid="question-bank-create-simulado"
          isDisabled={!canCreateSimulado}
          size="sm"
          startContent={<FontAwesomeIcon aria-hidden="true" className="w-3.5 h-3.5" icon={faClipboardCheck} />}
          onPress={onCreateSimulado}
        >
          {t('questionBank.createSimulado')}
        </Button>
        <Button
          className={buttonStyles.dangerFlat}
          data-testid="question-bank-bulk-delete"
          size="sm"
          startContent={<FontAwesomeIcon aria-hidden="true" className="w-3.5 h-3.5" icon={faTrash} />}
          onPress={onBulkDelete}
        >
          {t('common.delete')}
        </Button>
      </div>
    </div>
  );
}
