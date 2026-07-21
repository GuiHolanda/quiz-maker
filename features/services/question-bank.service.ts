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
    const { userId, type = 'all', search, source, topic, difficulty, hasAnswer, hasExplanation, page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const certResults = type === 'all' || type === 'certification'
      ? await this.fetchCertificationQuestions({ userId, search, source, topic, difficulty, hasAnswer, hasExplanation })
      : [];

    const examResults = type === 'all' || type === 'public_exam'
      ? await this.fetchPublicExamQuestions({ userId, search, source, topic, difficulty, hasAnswer, hasExplanation })
      : [];

    const combined = [...certResults, ...examResults].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = combined.length;
    const questions = combined.slice(skip, skip + pageSize);

    return { questions, total, page, pageSize };
  }

  private async fetchCertificationQuestions(filters: {
    userId: string;
    search?: string;
    source?: string[];
    topic?: string[];
    difficulty?: string[];
    hasAnswer?: boolean;
    hasExplanation?: boolean;
  }): Promise<UnifiedQuestion[]> {
    const { userId, search, source, topic, difficulty, hasAnswer, hasExplanation } = filters;

    const where: Record<string, unknown> = { userId };
    if (search) where['text'] = { contains: search, mode: 'insensitive' };
    if (source && source.length > 0) where['certificationTitle'] = { in: source };
    if (topic && topic.length > 0) where['topic'] = { in: topic };
    if (difficulty && difficulty.length > 0) where['difficulty'] = { in: difficulty };
    if (hasAnswer === true) where['answer'] = { isNot: null };
    if (hasAnswer === false) where['answer'] = { is: null };

    const rows = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { options: true, answer: { include: { explanations: true } } },
    });

    const filtered = hasExplanation !== undefined
      ? rows.filter((q) => {
          const exCount = q.answer?.explanations?.length ?? 0;
          return hasExplanation ? exCount > 0 : exCount === 0;
        })
      : rows;

    return filtered.map((q) => ({
      id: q.id,
      type: 'certification' as const,
      text: q.text,
      difficulty: q.difficulty,
      topic: q.topic,
      sourceLabel: q.certificationTitle,
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
    }));
  }

  private async fetchPublicExamQuestions(filters: {
    userId: string;
    search?: string;
    source?: string[];
    topic?: string[];
    difficulty?: string[];
    hasAnswer?: boolean;
    hasExplanation?: boolean;
  }): Promise<UnifiedQuestion[]> {
    const { userId, search, source, topic, difficulty, hasAnswer, hasExplanation } = filters;

    const where: Record<string, unknown> = { userId };
    if (search) where['text'] = { contains: search, mode: 'insensitive' };
    if (source && source.length > 0) where['publicExamName'] = { in: source };
    if (topic && topic.length > 0) where['subject'] = { in: topic };
    if (difficulty && difficulty.length > 0) where['difficulty'] = { in: difficulty };
    if (hasAnswer === true) where['answer'] = { isNot: null };
    if (hasAnswer === false) where['answer'] = { is: null };

    const rows = await prisma.publicExamQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { options: true, answer: { include: { explanations: true } } },
    });

    const filtered = hasExplanation !== undefined
      ? rows.filter((q) => {
          const exCount = q.answer?.explanations?.length ?? 0;
          return hasExplanation ? exCount > 0 : exCount === 0;
        })
      : rows;

    return filtered.map((q) => ({
      id: q.id,
      type: 'public_exam' as const,
      text: q.text,
      difficulty: q.difficulty,
      topic: q.subject + (q.topic ? ` · ${q.topic}` : ''),
      sourceLabel: q.publicExamName,
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
    }));
  }
}
