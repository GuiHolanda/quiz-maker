'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { faCircleCheck, faCircleNotch, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import type { FullExamJobTopicStatus } from '@/shared/types';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface ActiveJobStatusProps {
  readonly jobId: string;
  readonly refName: string;
  readonly status: 'running' | 'awaiting_review' | 'done' | 'error';
  readonly doneTopics: number;
  readonly totalTopics: number;
  readonly topics: FullExamJobTopicStatus[];
  readonly onCancel: () => void;
  readonly onSaveAll: () => void;
  readonly onReviewAndSelect: () => void;
  readonly isSaving?: boolean;
}

export function ActiveJobStatus({
  refName,
  status,
  doneTopics,
  totalTopics,
  topics,
  onCancel,
  onSaveAll,
  onReviewAndSelect,
  isSaving = false,
}: ActiveJobStatusProps) {
  const { t } = useTranslation();

  if (status === 'done') return null;

  const doneTopicsList = topics.filter((topic) => topic.status === 'done');
  const totalQuestionsReady = doneTopicsList.reduce((acc, topic) => acc + topic.questionCount, 0);

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-foreground">{refName}</span>
        {status === 'running' && (
          <Chip color="warning" size="sm" variant="flat">
            {t('busy.generating')}
          </Chip>
        )}
        {status === 'awaiting_review' && (
          <Chip color="primary" size="sm" variant="flat">
            {t('generate.awaitingReview')}
          </Chip>
        )}
      </div>

      {status === 'running' && (
        <>
          <Progress
            aria-label={t('generate.generatingProgress', { completed: doneTopics, total: totalTopics })}
            classNames={{ label: 'text-xs', value: 'text-xs' }}
            color="warning"
            label={t('generate.generatingProgress', { completed: doneTopics, total: totalTopics })}
            showValueLabel={false}
            size="sm"
            value={totalTopics > 0 ? (doneTopics / totalTopics) * 100 : 0}
          />
          {renderTopicList()}
          <Button className={`${buttonStyles.dangerFlat} self-start`} size="sm" onPress={onCancel}>
            {t('common.cancel')}
          </Button>
        </>
      )}

      {status === 'awaiting_review' && (
        <>
          <p className="text-sm text-default-500">
            {t('generate.questionsReady', { count: totalQuestionsReady, topics: doneTopicsList.length })}
          </p>
          {renderTopicList()}
          <div className="flex gap-2 flex-wrap">
            <Button className={buttonStyles.primary} isLoading={isSaving} size="sm" onPress={onSaveAll}>
              {t('generate.saveAll')}
            </Button>
            <Button className={buttonStyles.secondary} size="sm" variant="bordered" onPress={onReviewAndSelect}>
              {t('generate.reviewAndSelect')}
            </Button>
          </div>
        </>
      )}

      {status === 'error' && (
        <InlineAlert color="danger" icon={faCircleXmark} title={t('generate.statusError')} endContent={renderTopicList()} />
      )}
    </div>
  );

  function renderTopicList() {
    if (topics.length === 0) return null;

    return (
      <div className="flex flex-col gap-1">
        {topics.map((topic) => {
          const icon =
            topic.status === 'done' ? faCircleCheck
            : topic.status === 'error' ? faCircleXmark
            : topic.status === 'running' ? faCircleNotch
            : null;

          const colorClass =
            topic.status === 'done' ? 'text-success'
            : topic.status === 'error' ? 'text-danger'
            : topic.status === 'running' ? 'text-warning'
            : 'text-default-400';

          return (
            <div key={topic.id} className="flex items-start gap-2 text-xs">
              {icon ? (
                <FontAwesomeIcon
                  className={`w-3 h-3 mt-0.5 shrink-0 ${colorClass} ${topic.status === 'running' ? 'animate-spin' : ''}`}
                  icon={icon}
                />
              ) : (
                <span className="w-3 h-3 mt-0.5 shrink-0 rounded-full border border-default-300 inline-block" />
              )}
              <span className={topic.status === 'error' ? 'text-danger' : 'text-default-500'}>
                {topic.topicName}
                {topic.status === 'done' && (
                  <span className="text-default-400 ml-1">({topic.questionCount}q)</span>
                )}
                {topic.status === 'error' && topic.errorMessage && (
                  <span className="text-default-400 ml-1">— {topic.errorMessage}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
}
