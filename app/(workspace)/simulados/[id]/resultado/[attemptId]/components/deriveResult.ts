import type { MockExamResult } from '@/shared/types';

export type ScoreTone = 'success' | 'warning' | 'danger';

export const TONE_TEXT: Record<ScoreTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export const TONE_BG: Record<ScoreTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};
export type TopicTag = 'strong' | 'attention' | 'critical';
export type QuestionStatus = 'correct' | 'wrong' | 'blank';

export interface ReviewQuestion {
  examQuestionId: number;
  mockExamQuestionId: number;
  order: number;
  sectionName: string;
  topicName: string | null;
  text: string;
  options: Record<string, string>;
  correctOptions: string[];
  selectedOptions: string[];
  status: QuestionStatus;
}

export interface TopicRow {
  sectionName: string;
  correct: number;
  total: number;
  percent: number;
  weightPercent: number;
  tone: ScoreTone;
  tag: TopicTag;
  delta: number | null;
}

export interface ResultView {
  examName: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  percent: number;
  tone: ScoreTone;
  passingScorePercent: number | null;
  passed: boolean | null;
  marginPP: number | null;
  elapsedMs: number | null;
  elapsedLabel: string | null;
  perQuestionLabel: string | null;
  durationMinutes: number | null;
  durationLabel: string | null;
  attemptNumber: number;
  totalAttempts: number;
  previousAvgPercent: number | null;
  topics: TopicRow[];
  weakest: TopicRow | null;
  questions: ReviewQuestion[];
}

function overallTone(percent: number): ScoreTone {
  if (percent >= 70) return 'success';
  if (percent >= 50) return 'warning';

  return 'danger';
}

function topicTag(percent: number): { tag: TopicTag; tone: ScoreTone } {
  if (percent >= 75) return { tag: 'strong', tone: 'success' };
  if (percent >= 60) return { tag: 'attention', tone: 'warning' };

  return { tag: 'critical', tone: 'danger' };
}

function formatClock(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h${String(minutes).padStart(2, '0')}`;

  return `${minutes}min`;
}

function formatPerQuestion(ms: number): string {
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  if (minutes > 0) return `${minutes}min${String(rest).padStart(2, '0')}`;

  return `${rest}s`;
}

function formatBudget(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h${String(minutes).padStart(2, '0')}`;

  return `${minutes}min`;
}

export function deriveResult(result: MockExamResult): ResultView {
  const total = result.questions.length;
  const correct = result.attempt.score ?? 0;

  const selectedByMqId = new Map(result.attempt.answers.map((a) => [a.mockExamQuestionId, a.selectedOptions]));

  const questions: ReviewQuestion[] = result.questions
    .map((mq) => {
      const correctOptions = mq.examQuestion.answer?.correctOptions ?? [];
      const selectedOptions = selectedByMqId.get(mq.id) ?? [];
      const isCorrect =
        correctOptions.length > 0 &&
        selectedOptions.length === correctOptions.length &&
        selectedOptions.every((option) => correctOptions.includes(option));
      const status: QuestionStatus = selectedOptions.length === 0 ? 'blank' : isCorrect ? 'correct' : 'wrong';

      return {
        examQuestionId: mq.examQuestion.id,
        mockExamQuestionId: mq.id,
        order: mq.order,
        sectionName: mq.examQuestion.sectionName,
        topicName: mq.examQuestion.topic ?? null,
        text: mq.examQuestion.text,
        options: mq.examQuestion.options as Record<string, string>,
        correctOptions,
        selectedOptions,
        status,
      };
    })
    .sort((a, b) => a.order - b.order);

  const blank = questions.filter((question) => question.status === 'blank').length;
  const wrong = total - correct - blank;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  const passingScorePercent = result.examMeta.passingScorePercent;
  const passed = passingScorePercent != null ? percent >= passingScorePercent : null;
  const marginPP = passingScorePercent != null ? percent - passingScorePercent : null;
  const tone: ScoreTone = passed == null ? overallTone(percent) : passed ? 'success' : 'danger';

  const startedAt = new Date(result.attempt.startedAt).getTime();
  const finishedAt = result.attempt.finishedAt ? new Date(result.attempt.finishedAt).getTime() : null;
  const elapsedMs = finishedAt != null && finishedAt > startedAt ? finishedAt - startedAt : null;

  const topics: TopicRow[] = result.sectionBreakdown.map((section) => {
    const sectionPercent = section.total > 0 ? Math.round((section.correct / section.total) * 100) : 0;
    const { tag, tone } = topicTag(sectionPercent);

    return {
      sectionName: section.sectionName,
      correct: section.correct,
      total: section.total,
      percent: sectionPercent,
      weightPercent: section.weightPercent,
      tag,
      tone,
      delta: section.previousAvgPercent != null ? sectionPercent - section.previousAvgPercent : null,
    };
  });

  const weakest = topics.reduce<TopicRow | null>((lowest, topic) => {
    if (topic.total === 0) return lowest;
    if (!lowest || topic.percent < lowest.percent) return topic;

    return lowest;
  }, null);

  return {
    examName: result.mockExam.name ?? result.mockExam.exam.name,
    total,
    correct,
    wrong,
    blank,
    percent,
    tone,
    passingScorePercent,
    passed,
    marginPP,
    elapsedMs,
    elapsedLabel: elapsedMs != null ? formatClock(elapsedMs) : null,
    perQuestionLabel: elapsedMs != null && total > 0 ? formatPerQuestion(elapsedMs / total) : null,
    durationMinutes: result.examMeta.durationMinutes,
    durationLabel: result.examMeta.durationMinutes != null ? formatBudget(result.examMeta.durationMinutes) : null,
    attemptNumber: result.attemptNumber,
    totalAttempts: result.totalAttempts,
    previousAvgPercent: result.overallPreviousAvgPercent,
    topics,
    weakest,
    questions,
  };
}

export function formatFinishedAt(iso: string | null, locale: string): string {
  if (!iso) return '—';

  return new Date(iso).toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function signedPP(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;

  return '±0';
}
