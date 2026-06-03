import { prisma } from '@/lib/prisma';
import { PublicExamBrowseQuestionsResponse } from '@/shared/types';

export class PublicExamBrowseQuestionsService {
  async getQuestions(params: {
    publicExamName: string;
    subject: string;
    page: number;
    pageSize: number;
    userId: string;
  }): Promise<PublicExamBrowseQuestionsResponse> {
    const { publicExamName, subject, page, pageSize, userId } = params;
    const where = { publicExamName, subject, userId };
    const skip = (page - 1) * pageSize;

    const [total, rows] = await Promise.all([
      prisma.publicExamQuestion.count({ where }),
      prisma.publicExamQuestion.findMany({
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
      publicExamName: q.publicExamName,
      examBoardName: q.examBoardName,
      subject: q.subject,
      topic: q.topic ?? undefined,
      text: q.text,
      correctCount: q.correctCount,
      difficulty: q.difficulty,
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
    const question = await prisma.publicExamQuestion.findUnique({ where: { id } });
    if (!question) {
      throw Object.assign(new Error('Question not found'), { status: 404 });
    }
    if (question.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    await prisma.publicExamQuestion.delete({ where: { id } });
  }
}
