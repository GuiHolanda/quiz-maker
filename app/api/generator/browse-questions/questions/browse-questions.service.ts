import { prisma } from '@/lib/prisma';
import { BrowseQuestionsResponse } from '@/shared/types';

export class BrowseQuestionsService {
  async getQuestions(params: {
    certificationTitle: string;
    topic: string;
    page: number;
    pageSize: number;
    userId: string;
  }): Promise<BrowseQuestionsResponse> {
    const { certificationTitle, topic, page, pageSize, userId } = params;
    const where = { certificationTitle, topic, userId };
    const skip = (page - 1) * pageSize;

    const [total, rows] = await Promise.all([
      prisma.question.count({ where }),
      prisma.question.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          options: true,
          answer: { include: { explanations: true } },
        },
      }),
    ]);

    const questions = rows.map((q) => ({
      id: q.id,
      certificationTitle: q.certificationTitle,
      text: q.text,
      correctCount: q.correctCount,
      topic: q.topic,
      difficulty: q.difficulty,
      topicSubarea: q.topicSubarea ?? undefined,
      options: q.options.reduce((acc: Record<string, string>, o) => {
        acc[o.label] = o.text;
        return acc;
      }, {}),
      answer: q.answer
        ? {
            questionId: q.id,
            correctOptions: q.answer.correctOptions as string[],
            explanations: (q.answer.explanations || []).reduce(
              (a: Record<string, string>, ex) => {
                a[ex.label] = ex.text;
                return a;
              },
              {},
            ),
          }
        : { questionId: q.id, correctOptions: [], explanations: {} },
    }));

    return { questions, total, page, pageSize };
  }

  async deleteQuestion(id: number, userId: string): Promise<void> {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      throw Object.assign(new Error('Question not found'), { status: 404 });
    }
    if (question.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    await prisma.question.delete({ where: { id } });
  }
}
