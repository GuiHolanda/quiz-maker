'use client';
import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@heroui/popover';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';

import { ExamSection } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties, compactInputClassNames } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { ExamTopicRow } from '@/shared/components/exam-editor/ExamTopicRow';
import { ExamAddTopicRow } from '@/shared/components/exam-editor/ExamAddTopicRow';

// Shared with ExamDistributionTable's header row so columns line up.
export const DISTRIBUTION_GRID_COLS = 'grid grid-cols-[28px_minmax(0,1fr)_92px_84px_84px_34px] items-center gap-4';

interface ExamSectionRowProps {
  readonly section: ExamSection;
  readonly isSaving: boolean;
  readonly onUpdate: (patch: Partial<ExamSection>) => void;
  readonly onRemove: () => void;
  readonly onAddTopic: (name: string) => void;
  readonly onRemoveTopic: (topicIndex: number) => void;
  readonly onUpdateTopic: (topicIndex: number, newName: string) => void;
}

export function ExamSectionRow({
  section,
  isSaving,
  onUpdate,
  onRemove,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
}: ExamSectionRowProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const topics = section.topics ?? [];
  const topicCount = topics.length;

  return (
    <>
      <div className={`${DISTRIBUTION_GRID_COLS} px-3 py-4 bg-content2 border-b border-divider`}>
        <button
          aria-label={isExpanded ? t('common.collapse') : t('common.expand')}
          className="w-5 h-5 flex items-center justify-center rounded text-default-400 hover:text-primary hover:bg-default-100 transition-colors"
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <FontAwesomeIcon className="w-2.5 h-2.5" icon={isExpanded ? faChevronDown : faChevronRight} />
        </button>

        <Input
          {...inputProperties.input}
          aria-label={t('exam.sectionName')}
          classNames={compactInputClassNames}
          isDisabled={isSaving}
          size="sm"
          value={section.name}
          onValueChange={(v) => onUpdate({ name: v })}
        />

        {topicCount > 0 && (
          <span
            className={`inline-flex items-center justify-center px-1 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap bg-primary-500/50`}
          >
            {topicCount === 1
              ? t('exam.topicCountOne', { count: topicCount })
              : t('exam.topicCountOther', { count: topicCount })}
          </span>
        )}
        {topicCount === 0 && <span />}

        <Input
          {...inputProperties.input}
          aria-label={t('exam.minQuestions')}
          classNames={compactInputClassNames}
          endContent={<span className="text-xs text-default-400">%</span>}
          isDisabled={isSaving}
          size="sm"
          type="number"
          value={section.minQuestions.toString()}
          onValueChange={(v) => onUpdate({ minQuestions: parseFloat(v) || 0 })}
        />
        <Input
          {...inputProperties.input}
          aria-label={t('exam.maxQuestions')}
          classNames={compactInputClassNames}
          endContent={<span className="text-xs text-default-400">%</span>}
          isDisabled={isSaving}
          size="sm"
          type="number"
          value={section.maxQuestions.toString()}
          onValueChange={(v) => onUpdate({ maxQuestions: parseFloat(v) || 0 })}
        />

        <Popover isOpen={isConfirmingRemove} placement="left" onOpenChange={setIsConfirmingRemove}>
          <PopoverTrigger>
            <Button
              isIconOnly
              aria-label={t('common.remove')}
              className={buttonStyles.iconOnly.danger}
              isDisabled={isSaving}
              size="sm"
              variant="light"
            >
              <FontAwesomeIcon className="w-3 h-3" icon={faXmark} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-3 max-w-xs">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-foreground">{t('exam.removeSectionConfirm')}</p>
              <p className="text-xs text-default-500">{t('exam.removeSectionConfirmBody')}</p>
              <div className="flex gap-2 justify-end">
                <Button
                  className="text-xs h-7 px-3"
                  size="sm"
                  variant="flat"
                  onPress={() => setIsConfirmingRemove(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className={`${buttonStyles.danger} text-xs h-7 px-3`}
                  size="sm"
                  onPress={() => {
                    onRemove();
                    setIsConfirmingRemove(false);
                  }}
                >
                  {t('common.remove')}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {isExpanded &&
        topics.map((topic, ti) => (
          <ExamTopicRow
            key={topic.id ?? ti}
            isSaving={isSaving}
            topic={topic}
            onRemove={() => onRemoveTopic(ti)}
            onRename={(newName) => onUpdateTopic(ti, newName)}
          />
        ))}
      {isExpanded && <ExamAddTopicRow isSaving={isSaving} onAdd={onAddTopic} />}
    </>
  );
}
