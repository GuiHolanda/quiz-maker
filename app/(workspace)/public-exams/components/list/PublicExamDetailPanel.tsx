'use client';
import { useRef } from 'react';
import { faCalendar, faPen, faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';

import { ExamSectionsTable, ExamSectionsTableHandle } from '@/shared/components/ExamSectionsTable/ExamSectionsTable';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { Exam, ExamSection, ExamTopic } from '@/shared/types';

interface PublicExamDetailPanelProps {
  readonly exam: Exam;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onClose: () => void;
  readonly onSectionAdded: (section: ExamSection) => void;
  readonly onSectionRemoved: (sectionId: string) => void;
  readonly onSectionUpdated: (sectionId: string, newName: string, min: number, max: number) => void;
  readonly onTopicAdded: (sectionId: string, topic: ExamTopic) => void;
  readonly onTopicRemoved: (sectionId: string, topicId: string) => void;
  readonly onTopicUpdated: (sectionId: string, topicId: string, newName: string) => void;
}

export function PublicExamDetailPanel({
  exam,
  onEdit,
  onDelete,
  onClose,
  onSectionAdded,
  onSectionRemoved,
  onSectionUpdated,
  onTopicAdded,
  onTopicRemoved,
  onTopicUpdated,
}: PublicExamDetailPanelProps) {
  const { t } = useTranslation();
  const tableRef = useRef<ExamSectionsTableHandle | null>(null);

  return (
    <div className="mt-4 bg-content1 border border-primary/40 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-default-200 bg-content2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">{exam.name}</span>
          {exam.examBoard?.name && <span className="text-xs text-default-400 shrink-0">{exam.examBoard.name}</span>}
          {exam.year != null && (
            <span className="flex items-center gap-1 text-xs text-default-400 shrink-0">
              <FontAwesomeIcon className="text-[9px]" icon={faCalendar} />
              {exam.year}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            className={buttonStyles.flat}
            size="sm"
            startContent={<FontAwesomeIcon className="text-xs" icon={faPen} />}
            onPress={onEdit}
          >
            {t('concurso.editPublicExam')}
          </Button>
          <Button
            className={buttonStyles.dangerFlat}
            size="sm"
            startContent={<FontAwesomeIcon className="text-xs" icon={faTrash} />}
            onPress={onDelete}
          >
            {t('concurso.deleteExamTitle')}
          </Button>
          <Button
            isIconOnly
            aria-label={t('common.close')}
            className={buttonStyles.iconOnly.neutral}
            size="sm"
            variant="light"
            onPress={onClose}
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        </div>
      </div>

      <div className="p-5">
        <ExamSectionsTable
          ref={tableRef}
          selectedExam={exam}
          sectionsList={exam.sections}
          showTopics
          onSectionAdded={onSectionAdded}
          onSectionRemoved={onSectionRemoved}
          onSectionUpdated={onSectionUpdated}
          onTopicAdded={onTopicAdded}
          onTopicRemoved={onTopicRemoved}
          onTopicUpdated={onTopicUpdated}
        />

        <div className="mt-4 pt-3 border-t border-default-200 flex justify-start">
          <Button
            className={buttonStyles.primarySm}
            size="sm"
            startContent={<FontAwesomeIcon className="text-[10px]" icon={faPlus} />}
            onPress={() => tableRef.current?.startAdd()}
          >
            {t('concurso.addSubject')}
          </Button>
        </div>
      </div>
    </div>
  );
}
