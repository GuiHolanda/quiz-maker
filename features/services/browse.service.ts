import { prisma } from '@/lib/prisma';
import {
  BrowseQuestionsResponse,
  PublicExamBrowseQuestionsResponse,
  BrowseSummary,
  PublicExamBrowseSummary,
} from '@/shared/types';

// ---- Shared base for ownership-checked delete ----

interface OwnerCheckDelegate {
  findUnique(args: { where: { id: number } }): Promise<{ userId: string | null } | null>;
  delete(args: { where: { id: number } }): Promise<unknown>;
}

abstract class BaseBrowseService {
  protected abstract getDelegate(): OwnerCheckDelegate;

  async deleteQuestion(id: number, userId: string): Promise<void> {
    const question = await this.getDelegate().findUnique({ where: { id } });

    if (!question) {
      throw Object.assign(new Error('Question not found'), { status: 404 });
    }
    if (question.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    await this.getDelegate().delete({ where: { id } });
  }
}

// ---- Certification questions browse ----

export class BrowseQuestionsService extends BaseBrowseService {
  protected getDelegate(): OwnerCheckDelegate {
    return prisma.question as unknown as OwnerCheckDelegate;
  }

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

// ---- Public exam questions browse ----

export class PublicExamBrowseQuestionsService extends BaseBrowseService {
  protected getDelegate(): OwnerCheckDelegate {
    return prisma.publicExamQuestion as unknown as OwnerCheckDelegate;
  }

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

// ---- Summary services ----

export class BrowseSummaryService {
  async getSummary(userId: string): Promise<BrowseSummary> {
    const rows = await prisma.question.groupBy({
      by: ['certificationTitle', 'topic'],
      where: { userId },
      _count: { id: true },
      orderBy: { certificationTitle: 'asc' },
    });

    const certMap = new Map<string, { totalCount: number; topics: Map<string, number> }>();

    for (const row of rows) {
      const cert = certMap.get(row.certificationTitle) ?? { totalCount: 0, topics: new Map() };
      const count = row._count.id;

      cert.totalCount += count;
      cert.topics.set(row.topic, count);
      certMap.set(row.certificationTitle, cert);
    }

    const certLabels = await prisma.certification.findMany({
      where: { userId },
      select: { key: true, label: true },
    });
    const labelToKey = new Map(certLabels.map((c) => [c.label, c.key]));

    const certifications = Array.from(certMap.entries()).map(([label, data]) => ({
      label,
      key: labelToKey.get(label) ?? label,
      totalCount: data.totalCount,
      topics: Array.from(data.topics.entries()).map(([name, questionCount]) => ({
        name,
        questionCount,
      })),
    }));

    return { certifications };
  }
}

export class PublicExamBrowseSummaryService {
  async getSummary(userId: string): Promise<PublicExamBrowseSummary> {
    const rows = await prisma.publicExamQuestion.groupBy({
      by: ['publicExamName', 'examBoardName', 'subject'],
      where: { userId },
      _count: { id: true },
      orderBy: { publicExamName: 'asc' },
    });

    type ExamData = { id: string; examBoardName: string; totalCount: number; subjects: Map<string, number> };
    const examMap = new Map<string, ExamData>();

    for (const row of rows) {
      const exam = examMap.get(row.publicExamName) ?? {
        id: row.publicExamName,
        examBoardName: row.examBoardName,
        totalCount: 0,
        subjects: new Map(),
      };
      const count = row._count.id;

      exam.totalCount += count;
      exam.subjects.set(row.subject, count);
      examMap.set(row.publicExamName, exam);
    }

    const examRecords = await prisma.publicExam.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const nameToId = new Map(examRecords.map((e) => [e.name, e.id]));

    const publicExams = Array.from(examMap.entries()).map(([name, data]) => ({
      id: nameToId.get(name) ?? name,
      name,
      examBoardName: data.examBoardName,
      totalCount: data.totalCount,
      subjects: Array.from(data.subjects.entries()).map(([subjectName, questionCount]) => ({
        name: subjectName,
        questionCount,
      })),
    }));

    return { publicExams };
  }
}
