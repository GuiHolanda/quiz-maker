import { prisma } from '@/lib/prisma';
import { BrowseQuestionsResponse } from '@/shared/types';

// ---- Ownership-checked delete for ExamQuestion ----

export class BrowseQuestionsService {
  private async deleteRelated(id: number): Promise<void> {
    await prisma.examExplanation.deleteMany({ where: { answer: { questionId: id } } });
    await prisma.examAnswer.deleteMany({ where: { questionId: id } });
    await prisma.examOption.deleteMany({ where: { questionId: id } });
  }

  async deleteQuestion(id: number, userId: string): Promise<void> {
    const question = await prisma.examQuestion.findUnique({ where: { id } });

    if (!question) {
      throw Object.assign(new Error('Question not found'), { status: 404 });
    }
    if (question.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    await this.deleteRelated(id);
    await prisma.examQuestion.delete({ where: { id } });
  }

  async getQuestions(params: {
    examName: string;
    section: string;
    page: number;
    pageSize: number;
    userId: string;
  }): Promise<BrowseQuestionsResponse> {
    const { examName, section, page, pageSize, userId } = params;
    const where = { examName, sectionName: section, userId };
    const skip = (page - 1) * pageSize;

    const [total, rows] = await Promise.all([
      prisma.examQuestion.count({ where }),
      prisma.examQuestion.findMany({
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
      examName: q.examName,
      sectionName: q.sectionName,
      topic: q.topicName ?? undefined,
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
            explanations: (q.answer.explanations || []).reduce((a: Record<string, string>, ex) => {
              a[ex.label] = ex.text;

              return a;
            }, {}),
          }
        : { questionId: q.id, correctOptions: [], explanations: {} },
    }));

    return { questions, total, page, pageSize };
  }
}
