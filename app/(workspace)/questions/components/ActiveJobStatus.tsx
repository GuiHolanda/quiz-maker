'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { Spinner } from '@heroui/spinner';
import {
  faCircleCheck,
  faCircleNotch,
  faCircleXmark,
  faBolt,
  faCheckCircle,
  faLayerGroup,
  faGraduationCap,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import type { GenerationJobTopicStatus } from '@/shared/types';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { SectionHeader } from '@/shared/components/ui/SectionHeader';

interface ActiveJobStatusProps {
  readonly refName: string;
  readonly type: 'certification' | 'public_exam';
  readonly status: 'queued' | 'running' | 'awaiting_review' | 'done' | 'error';
  readonly doneTopics: number;
  readonly totalTopics: number;
  readonly queuedTopics: number;
  readonly topics: GenerationJobTopicStatus[];
  readonly onCancel: () => void;
  readonly onSaveAll: () => void;
  readonly onReviewAndSelect: () => void;
  readonly isSaving?: boolean;
  readonly showSectionHeader?: boolean;
}

export function ActiveJobStatus({
  refName,
  type,
  status,
  doneTopics,
  totalTopics,
  queuedTopics,
  topics,
  onCancel,
  onSaveAll,
  onReviewAndSelect,
  isSaving = false,
  showSectionHeader = true,
}: ActiveJobStatusProps) {
  const { t } = useTranslation();

  if (status === 'done') return null;

  const doneTopicsList = topics.filter((topic) => topic.status === 'done');
  const totalQuestionsReady = doneTopicsList.reduce((acc, topic) => acc + topic.questionCount, 0);
  const progressValue = totalTopics > 0 ? (doneTopics / totalTopics) * 100 : 0;

  // "queued" e "running" compartilham a UI de progresso — a distinção fica nos pills dos tópicos.
  const isRunning = status === 'running' || status === 'queued';
  const isError = status === 'error';
  // Timeout: erro sem nenhum dado parcial (todos os tópicos ficaram em queued/running).
  const isTimeout =
    isError && topics.length > 0 && topics.every((topic) => topic.status === 'queued' || topic.status === 'running');
  const headerIconColor = isRunning ? 'text-warning' : isError ? 'text-danger' : 'text-primary';
  const headerBgColor = isRunning ? 'bg-warning/10' : isError ? 'bg-danger/10' : 'bg-primary/10';

  return (
    <section aria-live="polite" className="mt-8" data-testid="question-gen-status">
      {showSectionHeader && (
        <SectionHeader
          className="mb-3"
          icon={faBolt}
          subtitle={t('generate.statusSectionSubtitleRunning')}
          title={t('generate.statusSection')}
        />
      )}

      <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
        {renderCardHeader()}
        {isRunning && (
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
            {queuedTopics > 0 && (
              <p className="text-xs text-warning">{t('generate.queuedHint', { count: queuedTopics })}</p>
            )}
            {renderTopicList()}
            <Button
              className={`${buttonStyles.dangerFlat} self-start`}
              data-testid="question-gen-job-cancel-btn"
              size="sm"
              onPress={onCancel}
            >
              {t('common.cancel')}
            </Button>
          </>
        )}

        {status === 'awaiting_review' && (
          <>
            {renderStatPair(totalQuestionsReady, doneTopicsList.length)}
            {renderTopicList()}
            <div className="flex gap-2 flex-wrap pt-4">
              <Button
                className={buttonStyles.primary}
                data-testid="question-gen-save-all-btn"
                isLoading={isSaving}
                size="sm"
                onPress={onSaveAll}
              >
                {t('generate.saveAll')}
              </Button>
              <Button className={buttonStyles.secondary} size="sm" variant="bordered" onPress={onReviewAndSelect}>
                {t('generate.reviewAndSelect')}
              </Button>
              <Button className={`${buttonStyles.dangerFlat} ml-auto`} size="sm" onPress={onCancel}>
                {t('common.discard')}
              </Button>
            </div>
          </>
        )}

        {isError &&
          (isTimeout ? (
            <InlineAlert
              color="warning"
              description={t('generate.timeoutDescription')}
              endContent={
                <Button className={buttonStyles.secondary} size="sm" variant="bordered" onPress={onCancel}>
                  {t('generate.retry')}
                </Button>
              }
              icon={faCircleXmark}
              title={t('generate.timeoutTitle')}
            />
          ) : (
            <InlineAlert
              color="danger"
              endContent={topics.length > 0 ? renderTopicList() : undefined}
              icon={faCircleXmark}
              title={t('generate.statusError')}
            />
          ))}
      </div>
    </section>
  );

  function renderCardHeader() {
    const chip = isRunning ? (
      <Chip
        color="warning"
        size="sm"
        startContent={<Spinner classNames={{ wrapper: 'w-3 h-3' }} color="current" size="sm" />}
        variant="flat"
      >
        <span className="ml-2">{status === 'queued' ? t('generate.statusQueued') : t('busy.generating')}</span>
      </Chip>
    ) : status === 'awaiting_review' ? (
      <Chip color="primary" size="sm" variant="flat">
        {t('generate.awaitingReview')}
      </Chip>
    ) : isError ? (
      <Chip color="danger" size="sm" variant="flat">
        {t('generate.statusError')}
      </Chip>
    ) : null;

    return (
      <div className="flex items-center gap-3 pb-4 border-b border-default-200">
        <div className={`w-8 h-8 rounded-lg ${headerBgColor} flex items-center justify-center shrink-0`}>
          <FontAwesomeIcon
            className={`w-3.5 h-3.5 ${headerIconColor}`}
            icon={type === 'certification' ? faGraduationCap : faClipboardList}
          />
        </div>
        <p className="flex-1 min-w-0 text-md font-bold text-foreground truncate">{refName}</p>
        {chip}
      </div>
    );
  }

  function renderStatPair(questionsReady: number, topicsDone: number) {
    return (
      <div>
        <div className="flex items-stretch gap-8">
          <div className="flex items-end gap-3 rounded-lg py-3">
            <div className="w-7 h-7 rounded-md bg-success/15 flex items-center justify-center shrink-0">
              <FontAwesomeIcon className="w-3.5 h-3.5 text-success" icon={faCheckCircle} />
            </div>
            <div className="flex gap-2 items-end">
              <span className="text-xl font-bold text-foreground tabular-nums leading-none">{questionsReady}</span>
              <span className="text-xs text-default-400 mt-0.5 font-semibold">
                {t('generate.historyGeneratedLabel')}
              </span>
            </div>
          </div>
          <div className="flex items-end gap-3 rounded-lg py-3">
            <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
              <FontAwesomeIcon className="w-3.5 h-3.5 text-primary" icon={faLayerGroup} />
            </div>
            <div className="flex gap-2 items-end">
              <span className="text-xl font-bold text-foreground tabular-nums leading-none">{topicsDone}</span>
              <span className="text-xs text-default-400 mt-0.5 font-semibold">{t('generate.topicsDoneLabel')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderTopicList() {
    if (topics.length === 0) return null;

    return (
      <div className="flex flex-col divide-y divide-divider border-y border-default-200">
        {topics.map((topic) => {
          const isDone = topic.status === 'done';
          const isTopicRunning = topic.status === 'running';
          const isTopicError = topic.status === 'error';

          const iconNode = isDone
            ? faCircleCheck
            : isTopicError
              ? faCircleXmark
              : isTopicRunning
                ? faCircleNotch
                : null;

          const boxBg = isDone
            ? 'bg-success/10'
            : isTopicError
              ? 'bg-danger/10'
              : isTopicRunning
                ? 'bg-warning/10'
                : 'bg-default-100';

          const iconColor = isDone
            ? 'text-success'
            : isTopicError
              ? 'text-danger'
              : isTopicRunning
                ? 'text-warning'
                : 'text-default-300';

          return (
            <div key={topic.id} className="flex items-center gap-3 py-2.5">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${boxBg}`}>
                {iconNode ? (
                  <FontAwesomeIcon
                    aria-hidden="true"
                    className={`w-3.5 h-3.5 ${iconColor} ${isTopicRunning ? 'animate-spin' : ''}`}
                    icon={iconNode}
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full border border-default-300 inline-block" />
                )}
              </div>
              <span className={`flex-1 text-sm truncate ${isTopicError ? 'text-danger' : 'text-foreground'}`}>
                {topic.topicName}
              </span>
              {isDone && (
                <span className="text-xs font-medium text-default-500 tabular-nums shrink-0 rounded-md px-2 py-1">
                  {t('generate.topicQuestions', { count: topic.questionCount })}
                </span>
              )}
              {isTopicError && (
                <span
                  className="text-xs text-danger/70 shrink-0 max-w-[140px] truncate"
                  title={topic.errorMessage ?? undefined}
                >
                  {topic.errorType === 'quota'
                    ? t('generate.errorQuota')
                    : topic.errorType === 'timeout'
                      ? t('generate.errorTimeout')
                      : t('generate.errorGeneration')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}
