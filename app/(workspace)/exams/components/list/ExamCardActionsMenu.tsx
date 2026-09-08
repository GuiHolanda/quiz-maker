'use client';

import NextLink from 'next/link';
import { faWandMagicSparkles, faFileLines, faBookOpen, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { Exam } from '@/shared/types';

interface ExamCardActionsMenuProps {
  readonly exam: Exam;
  readonly onDelete: () => void;
}

export function ExamCardActionsMenu({ exam, onDelete }: ExamCardActionsMenuProps) {
  const { t } = useTranslation();

  const linkClass =
    'flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-background border border-default-200 ' +
    'dark:border-transparent text-foreground transition-colors duration-200 hover:bg-content2';

  return (
    <div className="mt-3 pt-3 border-t border-default-200 dark:border-transparent flex flex-wrap items-center justify-end gap-2">
      <NextLink className={linkClass} data-testid="exam-card-action-generate" href={`/questions?examId=${exam.id}`}>
        <FontAwesomeIcon className="text-xs" icon={faWandMagicSparkles} />
        {t('exam.actionGenerate')}
      </NextLink>
      <NextLink className={linkClass} data-testid="exam-card-action-simulado" href={`/simulados?examId=${exam.id}`}>
        <FontAwesomeIcon className="text-xs" icon={faFileLines} />
        {t('exam.actionCreateSimulado')}
      </NextLink>
      <NextLink
        className={linkClass}
        data-testid="exam-card-action-question-bank"
        href={`/question-bank?examId=${exam.id}`}
      >
        <FontAwesomeIcon className="text-xs" icon={faBookOpen} />
        {t('exam.actionQuestionBank')}
      </NextLink>
      <NextLink className={linkClass} data-testid="exam-card-action-edit" href={`/exams/${exam.id}/edit`}>
        <FontAwesomeIcon className="text-xs" icon={faPen} />
        {t('certification.editCertification')}
      </NextLink>
      <button
        className={`${linkClass} text-danger`}
        data-testid="exam-card-action-remove"
        type="button"
        onClick={onDelete}
      >
        <FontAwesomeIcon className="text-xs" icon={faTrash} />
        {t('common.remove')}
      </button>
    </div>
  );
}
