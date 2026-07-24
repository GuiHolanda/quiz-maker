'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { Spinner } from '@heroui/spinner';
import { faCircleCheck, faCircleNotch, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import type { FullExamJobTopicStatus } from '@/shared/types';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface ActiveJobStatusProps {
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
  const progressValue = totalTopics > 0 ? (doneTopics / totalTopics) * 100 : 0;

  return (
    <div aria-live="polite" className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-foreground">{refName}</span>
        {status === 'running' && (
          <Chip
            color="warning"
            size="sm"
            startContent={<Spinner color="current" size="sm" classNames={{ wrapper: 'w-3 h-3' }} />}
            variant="flat"
          >
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
            classNames={{ label: 'text-xs text-default-500', value: 'text-xs text-default-500' }}
            color="warning"
            label={t('generate.generatingProgress', { completed: doneTopics, total: totalTopics })}
            showValueLabel={false}
            size="sm"
            value={progressValue}
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
            <Button className={buttonStyles.dangerFlat} size="sm" onPress={onCancel}>
              {t('common.discard')}
            </Button>
          </div>
        </>
      )}

      {status === 'error' && (
        <InlineAlert
          color="danger"
          icon={faCircleXmark}
          title={t('generate.statusError')}
          endContent={topics.length > 0 ? renderTopicList() : undefined}
        />
      )}
    </div>
  );

  function renderTopicList() {
    if (topics.length === 0) return null;

    return (
      <div className="flex flex-col gap-1.5 mt-1">
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
            : 'text-default-300';

          return (
            <div key={topic.id} className="flex items-center gap-2 text-xs">
              <span className="w-3 shrink-0 flex items-center justify-center">
                {icon ? (
                  <FontAwesomeIcon
                    aria-hidden="true"
                    className={`w-3 h-3 ${colorClass} ${topic.status === 'running' ? 'animate-spin' : ''}`}
                    icon={icon}
                  />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full border border-default-300 inline-block" />
                )}
              </span>
              <span className={`flex-1 ${topic.status === 'error' ? 'text-danger' : 'text-default-500'}`}>
                {topic.topicName}
              </span>
              {topic.status === 'done' && (
                <span className="text-default-400 shrink-0">{t('generate.topicQuestionCount', { count: topic.questionCount })}</span>
              )}
              {topic.status === 'error' && topic.errorMessage && (
                <span className="text-danger/70 shrink-0 max-w-[120px] truncate" title={topic.errorMessage}>
                  {topic.errorMessage}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}
