import { prisma } from '@/lib/prisma';
import type {
  QuestionBankResponse,
  QuestionBankSummary,
  QuestionHistory,
  QuestionSituation,
  UnifiedQuestion,
} from '@/shared/types';

export interface QuestionBankParams {
  userId: string;
  type?: 'certification' | 'public_exam' | 'all';
  search?: string;
  source?: string[];
  topic?: string[];
  difficulty?: string[];
  hasAnswer?: boolean;
  hasExplanation?: boolean;
  situation?: QuestionSituation;
  explanation?: 'with' | 'without';
  sort?: 'asc' | 'desc' | 'errorRate' | 'mostUsed';
  page: number;
  pageSize: number;
}

export type { QuestionBankResponse, UnifiedQuestion };

type HistoryEntry = { isCorrect: boolean; selectedOptions: string[]; finishedAt: Date };

function parseSelectedOptions(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function buildHistory(entries: HistoryEntry[] | undefined): QuestionHistory {
  const list = entries ?? [];
  const attempts = list.length;
  const correct = list.filter((entry) => entry.isCorrect).length;
  const latest = list[0];

  return {
    attempts,
    correct,
    accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
    situation: attempts === 0 ? 'unanswered' : latest.isCorrect ? 'correct' : 'wrong',
    markedOptions: latest ? latest.selectedOptions : [],
  };
}

export class QuestionBankService {
  async getQuestions(params: QuestionBankParams): Promise<QuestionBankResponse> {
    const {
      userId,
      type = 'all',
      search,
      source,
      topic,
      difficulty,
      hasAnswer,
      hasExplanation,
      situation,
      explanation,
      sort = 'desc',
      page,
      pageSize,
    } = params;
    const skip = (page - 1) * pageSize;

    const isSQLite = (process.env.DATABASE_URL ?? '').startsWith('file:');
    const where: Record<string, unknown> = { userId };
    if (search) {
      const textFilter = isSQLite ? { contains: search } : { contains: search, mode: 'insensitive' };
      where['OR'] = [
        { text: textFilter },
        { examName: textFilter },
        { sectionName: textFilter },
        { options: { some: { text: textFilter } } },
      ];
    }
    if (source && source.length > 0) where['examName'] = { in: source };
    if (topic && topic.length > 0) where['sectionName'] = { in: topic };
    if (difficulty && difficulty.length > 0) where['difficulty'] = { in: difficulty };
    if (hasAnswer === true) where['answer'] = { isNot: null };
    if (hasAnswer === false) where['answer'] = { is: null };
    if (type !== 'all') where['exam'] = { type };

    const dbSort: 'asc' | 'desc' = sort === 'asc' ? 'asc' : 'desc';

    const [rows, historyMap, summaryBase] = await Promise.all([
      prisma.examQuestion.findMany({
        where,
        orderBy: { createdAt: dbSort },
        include: { options: true, answer: { include: { explanations: true } }, exam: { select: { type: true } } },
      }),
      this.loadHistoryMap(userId),
      prisma.examQuestion.findMany({
        where: { userId },
        select: { id: true, answer: { select: { explanations: { take: 1, select: { id: true } } } } },
      }),
    ]);

    const combined: UnifiedQuestion[] = rows.map((q) => {
      const examType = (q.exam?.type as 'certification' | 'public_exam') ?? 'certification';
      const topicLabel =
        examType === 'public_exam' ? q.sectionName + (q.topicName ? ` · ${q.topicName}` : '') : q.sectionName;

      return {
        id: q.id,
        type: examType,
        text: q.text,
        difficulty: q.difficulty,
        topic: topicLabel,
        sectionName: q.sectionName,
        sourceLabel: q.examName,
        examId: q.examId ?? null,
        options: q.options.reduce((acc: Record<string, string>, o) => {
          acc[o.label] = o.text;
          return acc;
        }, {}),
        answer: q.answer
          ? {
              correctOptions: q.answer.correctOptions as string[],
              explanations: (q.answer.explanations ?? []).reduce((a: Record<string, string>, ex) => {
                a[ex.label] = ex.text;
                return a;
              }, {}),
            }
          : null,
        createdAt: q.createdAt.toISOString(),
        correctCount: q.correctCount,
        history: buildHistory(historyMap.get(q.id)),
      };
    });

    const filtered = combined.filter((q) => {
      const answered = q.history.situation !== 'unanswered';
      const explanationCount = q.answer ? Object.keys(q.answer.explanations).length : 0;

      if (hasExplanation === true && explanationCount === 0) return false;
      if (hasExplanation === false && explanationCount > 0) return false;
      if (explanation === 'with' && !(answered && explanationCount > 0)) return false;
      if (explanation === 'without' && !(answered && explanationCount === 0)) return false;
      if (situation && q.history.situation !== situation) return false;

      return true;
    });

    const sorted = this.applySort(filtered, sort);
    const total = sorted.length;
    const questions = sorted.slice(skip, skip + pageSize);
    const summary = this.buildSummary(summaryBase, historyMap);

    return { questions, total, page, pageSize, summary };
  }

  private async loadHistoryMap(userId: string): Promise<Map<number, HistoryEntry[]>> {
    const answerRows = await prisma.mockExamAttemptAnswer.findMany({
      where: {
        attempt: { userId, finishedAt: { not: null } },
        mockExamQuestion: { examQuestion: { userId } },
      },
      select: {
        isCorrect: true,
        selectedOptions: true,
        attempt: { select: { finishedAt: true } },
        mockExamQuestion: { select: { examQuestionId: true } },
      },
    });

    const map = new Map<number, HistoryEntry[]>();
    for (const row of answerRows) {
      const questionId = row.mockExamQuestion.examQuestionId;
      const list = map.get(questionId) ?? [];

      list.push({
        isCorrect: row.isCorrect,
        selectedOptions: parseSelectedOptions(row.selectedOptions),
        finishedAt: row.attempt.finishedAt ?? new Date(0),
      });
      map.set(questionId, list);
    }

    map.forEach((list) => {
      list.sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime());
    });

    return map;
  }

  private applySort(questions: UnifiedQuestion[], sort: QuestionBankParams['sort']): UnifiedQuestion[] {
    if (sort !== 'errorRate' && sort !== 'mostUsed') return questions;

    const answeredRank = (q: UnifiedQuestion) => (q.history.situation === 'unanswered' ? 0 : 1);
    const list = questions.slice();

    if (sort === 'errorRate') {
      return list.sort((a, b) => answeredRank(b) - answeredRank(a) || a.history.accuracy - b.history.accuracy);
    }

    return list.sort((a, b) => answeredRank(b) - answeredRank(a) || b.history.attempts - a.history.attempts);
  }

  private buildSummary(
    base: { id: number; answer: { explanations: { id: number }[] } | null }[],
    historyMap: Map<number, HistoryEntry[]>
  ): QuestionBankSummary {
    const bySituation = { correct: 0, wrong: 0, unanswered: 0 };
    let attempts = 0;
    let correct = 0;
    let withoutExplanation = 0;

    for (const question of base) {
      const history = buildHistory(historyMap.get(question.id));

      bySituation[history.situation] += 1;
      attempts += history.attempts;
      correct += history.correct;

      const hasExplanation = (question.answer?.explanations.length ?? 0) > 0;
      if (history.situation !== 'unanswered' && !hasExplanation) withoutExplanation += 1;
    }

    return {
      saved: base.length,
      answered: bySituation.correct + bySituation.wrong,
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      attempts,
      correct,
      withoutExplanation,
      bySituation,
    };
  }
}
