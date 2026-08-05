'use client';
import { useRef } from 'react';
import { faCalendar, faPen, faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';

import { ExamSectionsTable, ExamSectionsTableHandle } from '@/shared/components/ExamSectionsTable/ExamSectionsTable';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { Exam, ExamSection, ExamTopic, ExamType } from '@/shared/types';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';

interface ExamDetailPanelProps {
  readonly exam: Exam;
  readonly type: ExamType;
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

export function ExamDetailPanel({
  exam,
  type,
  onEdit,
  onDelete,
  onClose,
  onSectionAdded,
  onSectionRemoved,
  onSectionUpdated,
  onTopicAdded,
  onTopicRemoved,
  onTopicUpdated,
}: ExamDetailPanelProps) {
  const { t } = useTranslation();
  const config = EXAM_CONFIG[type];
  const tableRef = useRef<ExamSectionsTableHandle | null>(null);

  const referenceEntity = type === 'certification' ? exam.provider : exam.examBoard;

  return (
    <div className="mt-4 bg-content1 border border-primary/40 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-default-200 bg-content2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">{exam.name}</span>
          {referenceEntity?.name && (
            <span className="text-xs text-default-400 shrink-0">{referenceEntity.name}</span>
          )}
          {exam.key && <span className="text-xs text-default-400 font-medium shrink-0">{exam.key}</span>}
          {config.hasYearField && exam.year != null && (
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
            {t(config.editLabel)}
          </Button>
          <Button
            className={buttonStyles.dangerFlat}
            size="sm"
            startContent={<FontAwesomeIcon className="text-xs" icon={faTrash} />}
            onPress={onDelete}
          >
            {t(config.deleteTitle)}
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
          showTopics={config.showTopicsInSections}
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
            {t(config.addSectionLabel)}
          </Button>
        </div>
      </div>
    </div>
  );
}
