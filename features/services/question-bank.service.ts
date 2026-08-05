import { prisma } from '@/lib/prisma';

export interface UnifiedQuestion {
  id: number;
  type: 'certification' | 'public_exam';
  text: string;
  difficulty: string;
  topic: string;
  sourceLabel: string;
  options: Record<string, string>;
  answer: {
    correctOptions: string[];
    explanations: Record<string, string>;
  } | null;
  createdAt: string;
  correctCount: number;
}

export interface QuestionBankParams {
  userId: string;
  type?: 'certification' | 'public_exam' | 'all';
  search?: string;
  source?: string[];
  topic?: string[];
  difficulty?: string[];
  hasAnswer?: boolean;
  hasExplanation?: boolean;
  sort?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface QuestionBankResponse {
  questions: UnifiedQuestion[];
  total: number;
  page: number;
  pageSize: number;
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
      sort = 'desc',
      page,
      pageSize,
    } = params;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { userId };
    if (search) where['text'] = { contains: search };
    if (source && source.length > 0) where['examName'] = { in: source };
    if (topic && topic.length > 0) where['sectionName'] = { in: topic };
    if (difficulty && difficulty.length > 0) where['difficulty'] = { in: difficulty };
    if (hasAnswer === true) where['answer'] = { isNot: null };
    if (hasAnswer === false) where['answer'] = { is: null };
    if (type !== 'all') where['exam'] = { type };

    const rows = await prisma.examQuestion.findMany({
      where,
      orderBy: { createdAt: sort },
      include: { options: true, answer: { include: { explanations: true } }, exam: { select: { type: true } } },
    });

    const filtered =
      hasExplanation !== undefined
        ? rows.filter((q) => {
            const exCount = q.answer?.explanations?.length ?? 0;
            return hasExplanation ? exCount > 0 : exCount === 0;
          })
        : rows;

    const combined: UnifiedQuestion[] = filtered.map((q) => {
      const examType = (q.exam?.type as 'certification' | 'public_exam') ?? 'certification';
      const topicLabel =
        examType === 'public_exam' ? q.sectionName + (q.topicName ? ` · ${q.topicName}` : '') : q.sectionName;

      return {
        id: q.id,
        type: examType,
        text: q.text,
        difficulty: q.difficulty,
        topic: topicLabel,
        sourceLabel: q.examName,
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
      };
    });

    const total = combined.length;
    const questions = combined.slice(skip, skip + pageSize);

    return { questions, total, page, pageSize };
  }
}
