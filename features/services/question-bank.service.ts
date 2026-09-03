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

type QuestionCandidate = { id: number; answer: { explanations: { id: number }[] } | null };

type HydratedQuestion = {
  id: number;
  text: string;
  difficulty: string;
  examName: string;
  sectionName: string;
  topicName: string | null;
  examId: string | null;
  correctCount: number;
  createdAt: Date;
  options: { label: string; text: string }[];
  answer: { correctOptions: unknown; explanations: { label: string; text: string }[] } | null;
  exam: { type: string } | null;
};

// Presença de explicação é tudo que os filtros checam — take: 1 evita puxar a lista inteira.
const CANDIDATE_SELECT = {
  id: true,
  answer: { select: { explanations: { take: 1, select: { id: true } } } },
} as const;

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

    // Os filtros de situação/explicação e os sorts errorRate/mostUsed dependem do histórico
    // agregado, que não existe em coluna — por isso a lista de candidatos é lida inteira.
    // Ela carrega só id + presença de explicação; texto, alternativas e explicações são
    // buscados depois, apenas para os ids da página.
    const [candidates, historyMap, summaryBase] = await Promise.all([
      prisma.examQuestion.findMany({ where, orderBy: { createdAt: dbSort }, select: CANDIDATE_SELECT }),
      this.loadHistoryMap(userId),
      prisma.examQuestion.findMany({ where: { userId }, select: CANDIDATE_SELECT }),
    ]);

    const eligible = (candidates as QuestionCandidate[]).filter((candidate) => {
      const history = buildHistory(historyMap.get(candidate.id));
      const answered = history.situation !== 'unanswered';
      const explanationCount = candidate.answer?.explanations.length ?? 0;

      if (hasExplanation === true && explanationCount === 0) return false;
      if (hasExplanation === false && explanationCount > 0) return false;
      if (explanation === 'with' && !(answered && explanationCount > 0)) return false;
      if (explanation === 'without' && !(answered && explanationCount === 0)) return false;
      if (situation && history.situation !== situation) return false;

      return true;
    });

    const ordered = this.applySort(eligible, historyMap, sort);
    const pageIds = ordered.slice(skip, skip + pageSize).map((candidate) => candidate.id);

    return {
      questions: await this.hydrate(pageIds, historyMap),
      total: ordered.length,
      page,
      pageSize,
      summary: this.buildSummary(summaryBase, historyMap),
    };
  }

  private async hydrate(pageIds: number[], historyMap: Map<number, HistoryEntry[]>): Promise<UnifiedQuestion[]> {
    if (pageIds.length === 0) return [];

    const rows = (await prisma.examQuestion.findMany({
      where: { id: { in: pageIds } },
      include: { options: true, answer: { include: { explanations: true } }, exam: { select: { type: true } } },
    })) as unknown as HydratedQuestion[];

    const byId = new Map(rows.map((row) => [row.id, row]));

    // findMany não devolve na ordem do `in` — a ordenação vive em pageIds.
    return pageIds.flatMap((id) => {
      const row = byId.get(id);

      return row ? [this.toUnifiedQuestion(row, historyMap)] : [];
    });
  }

  private toUnifiedQuestion(row: HydratedQuestion, historyMap: Map<number, HistoryEntry[]>): UnifiedQuestion {
    const examType = (row.exam?.type as 'certification' | 'public_exam') ?? 'certification';
    const topicLabel =
      examType === 'public_exam' ? row.sectionName + (row.topicName ? ` · ${row.topicName}` : '') : row.sectionName;

    return {
      id: row.id,
      type: examType,
      text: row.text,
      difficulty: row.difficulty,
      topic: topicLabel,
      sectionName: row.sectionName,
      sourceLabel: row.examName,
      examId: row.examId ?? null,
      options: row.options.reduce((acc: Record<string, string>, option) => {
        acc[option.label] = option.text;
        return acc;
      }, {}),
      answer: row.answer
        ? {
            correctOptions: row.answer.correctOptions as string[],
            explanations: (row.answer.explanations ?? []).reduce((acc: Record<string, string>, entry) => {
              acc[entry.label] = entry.text;
              return acc;
            }, {}),
          }
        : null,
      createdAt: row.createdAt.toISOString(),
      correctCount: row.correctCount,
      history: buildHistory(historyMap.get(row.id)),
    };
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

  private applySort(
    candidates: QuestionCandidate[],
    historyMap: Map<number, HistoryEntry[]>,
    sort: QuestionBankParams['sort']
  ): QuestionCandidate[] {
    if (sort !== 'errorRate' && sort !== 'mostUsed') return candidates;

    const historyOf = (candidate: QuestionCandidate) => buildHistory(historyMap.get(candidate.id));
    const answeredRank = (candidate: QuestionCandidate) => (historyOf(candidate).situation === 'unanswered' ? 0 : 1);
    const list = candidates.slice();

    if (sort === 'errorRate') {
      return list.sort((a, b) => answeredRank(b) - answeredRank(a) || historyOf(a).accuracy - historyOf(b).accuracy);
    }

    return list.sort((a, b) => answeredRank(b) - answeredRank(a) || historyOf(b).attempts - historyOf(a).attempts);
  }

  private buildSummary(base: QuestionCandidate[], historyMap: Map<number, HistoryEntry[]>): QuestionBankSummary {
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
