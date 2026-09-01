'use client';

import { Button } from '@heroui/button';
import { faCircleXmark, faCheck, faGraduationCap, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import type { GenerationJobTopicStatus } from '@/shared/types';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

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
}

const SPINNER =
  'h-3 w-3 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin motion-reduce:animate-none';

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
}: ActiveJobStatusProps) {
  const { t } = useTranslation();

  if (status === 'done') return null;

  const isRunning = status === 'running' || status === 'queued';
  const isReview = status === 'awaiting_review';
  const isError = status === 'error';
  const isTimeout =
    isError && topics.length > 0 && topics.every((topic) => topic.status === 'queued' || topic.status === 'running');

  const totalQuestions = topics.reduce((acc, topic) => acc + topic.questionCount, 0);
  const questionsReady = topics
    .filter((topic) => topic.status === 'done')
    .reduce((acc, topic) => acc + topic.questionCount, 0);
  const progressPercent = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;
  const scopeLabel = type === 'certification' ? t('questionBank.typeCertification') : t('questionBank.typePublicExam');

  const pill = isReview
    ? { text: t('generate.readyPill'), className: 'border-success/30 bg-success/10 text-success', spin: false }
    : isError
      ? { text: t('generate.statusError'), className: 'border-danger/30 bg-danger/10 text-danger', spin: false }
      : { text: t('generate.generatingPill'), className: 'border-primary/35 bg-primary/10 text-primary', spin: true };

  return (
    <section aria-live="polite" className="flex flex-col rounded-xl bg-content1 p-6" data-testid="question-gen-status">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] bg-primary/10 text-primary">
            <FontAwesomeIcon
              className="h-[19px] w-[19px]"
              icon={type === 'certification' ? faGraduationCap : faClipboardList}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-[17px] font-bold tracking-tight text-foreground">{refName}</span>
            <span className="truncate font-mono text-[11.5px] text-default-400">
              {t('generate.batchMeta', { topics: totalTopics, questions: totalQuestions, scope: scopeLabel })}
            </span>
          </div>
        </div>

        <span
          className={`flex shrink-0 items-center gap-2 self-start rounded-full border px-3.5 py-[7px] text-[13px] font-semibold sm:self-auto ${pill.className}`}
        >
          {pill.spin && <span className={SPINNER} />}
          {pill.text}
        </span>
      </div>

      {isError && !isTimeout && (
        <div className="mt-4">
          <InlineAlert color="danger" icon={faCircleXmark} title={t('generate.statusError')} />
        </div>
      )}

      {isTimeout && (
        <div className="mt-4">
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
        </div>
      )}

      {!isError && (
        <>
          <div className="mt-[22px] border-t border-divider pt-5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13.5px] text-default-500">
                {t('generate.generatingProgress', { completed: doneTopics, total: totalTopics })}
              </span>
              <span className="font-mono text-xs text-default-400">
                {questionsReady}/{totalQuestions}
              </span>
            </div>
            <div className="mt-2.5 h-[5px] overflow-hidden rounded-full bg-content2">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${isReview ? 100 : progressPercent}%` }}
              />
            </div>
            {isRunning && queuedTopics > 0 && (
              <p className="mt-2 text-xs text-default-400">{t('generate.queuedHint', { count: queuedTopics })}</p>
            )}
          </div>

          <div className="mt-3.5 flex flex-col">{topics.map((topic) => renderTopicRow(topic))}</div>
        </>
      )}

      {isReview && (
        <div className="mt-5 flex flex-wrap gap-3">
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
      )}

      {isRunning && (
        <div className="mt-5">
          <Button
            className={`${buttonStyles.dangerFlat} self-start`}
            data-testid="question-gen-job-cancel-btn"
            size="sm"
            onPress={onCancel}
          >
            {t('common.cancel')}
          </Button>
        </div>
      )}
    </section>
  );

  function renderTopicRow(topic: GenerationJobTopicStatus) {
    const isDone = topic.status === 'done';
    const isTopicRunning = topic.status === 'running';
    const isTopicError = topic.status === 'error';

    const dot = isDone
      ? 'bg-success/15'
      : isTopicRunning
        ? 'bg-primary/15'
        : isTopicError
          ? 'bg-danger/15'
          : 'border border-divider';

    const meta = isDone
      ? { text: t('generate.topicQuestions', { count: topic.questionCount }), className: 'text-success' }
      : isTopicRunning
        ? { text: `${t('generate.statusRunning')} · ${topic.questionCount}`, className: 'text-primary' }
        : isTopicError
          ? {
              text:
                topic.errorType === 'quota'
                  ? t('generate.errorQuota')
                  : topic.errorType === 'timeout'
                    ? t('generate.errorTimeout')
                    : t('generate.errorGeneration'),
              className: 'max-w-[160px] truncate text-danger',
            }
          : { text: `${t('generate.statusQueued')} · ${topic.questionCount}`, className: 'text-default-400' };

    return (
      <div
        key={topic.id}
        className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-divider py-[15px] first:border-t-0"
      >
        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${dot}`}>
          {isDone && <FontAwesomeIcon className="h-3 w-3 text-success" icon={faCheck} />}
          {isTopicRunning && <span className={SPINNER} />}
          {isTopicError && <FontAwesomeIcon className="h-3 w-3 text-danger" icon={faCircleXmark} />}
        </span>
        <span
          className={`truncate text-[14.5px] ${
            isDone || isTopicRunning ? 'text-foreground' : isTopicError ? 'text-danger' : 'text-default-400'
          }`}
        >
          {topic.topicName}
        </span>
        <span className={`font-mono text-xs ${meta.className}`} title={topic.errorMessage ?? undefined}>
          {meta.text}
        </span>
      </div>
    );
  }
}
