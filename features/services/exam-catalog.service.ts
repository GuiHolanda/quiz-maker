import { prisma, PrismaService } from '@/lib/prisma';
import type { CatalogExam, AdminCatalogEntry, ExamType, ExamSection } from '@/shared/types';

export class ExamCatalogService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public async getTemplates(): Promise<CatalogExam[]> {
    const templates = await this.prismaService.exam.findMany({
      where: { isTemplate: true },
      include: {
        provider: true,
        examBoard: true,
        sections: { include: { topics: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const poolCounts = await this.prismaService.examQuestion.groupBy({
      by: ['examId'],
      where: {
        examId: { in: templates.map((t) => t.id) },
        poolId: { not: null },
      },
      _count: { id: true },
    });

    const countByExam = new Map(poolCounts.map((r) => [r.examId!, r._count.id]));

    return templates.map((t) => ({
      id: t.id,
      type: t.type as ExamType,
      name: t.name,
      role: t.role,
      year: t.year,
      key: t.key,
      totalQuestions: t.totalQuestions,
      provider: t.provider,
      examBoard: t.examBoard,
      sections: t.sections.map((s) => ({
        id: s.id,
        name: s.name,
        minQuestions: s.minQuestions,
        maxQuestions: s.maxQuestions,
        topics: s.topics.map((tp) => ({ id: tp.id, name: tp.name })),
      })) as ExamSection[],
      poolQuestionCount: countByExam.get(t.id) ?? 0,
    }));
  }

  public async forkExam(templateId: string, userId: string): Promise<string> {
    const template = await this.prismaService.exam.findFirst({
      where: { id: templateId, isTemplate: true },
      include: { sections: { include: { topics: true } } },
    });

    if (!template) {
      throw Object.assign(new Error('Template not found'), { status: 404 });
    }

    return this.prismaService.$transaction(async (tx) => {
      let providerId = template.providerId;
      let examBoardId = template.examBoardId;

      if (template.providerId) {
        const provider = await tx.provider.findUnique({ where: { id: template.providerId } });
        if (provider) {
          const upserted = await tx.provider.upsert({
            where: { name: provider.name },
            update: {},
            create: { name: provider.name, fullName: provider.fullName },
          });
          providerId = upserted.id;
        }
      }

      if (template.examBoardId) {
        const board = await tx.examBoard.findUnique({ where: { id: template.examBoardId } });
        if (board) {
          const upserted = await tx.examBoard.upsert({
            where: { name: board.name },
            update: {},
            create: { name: board.name, fullName: board.fullName },
          });
          examBoardId = upserted.id;
        }
      }

      const forked = await tx.exam.create({
        data: {
          type: template.type,
          name: template.name,
          role: template.role,
          year: template.year,
          key: template.key,
          totalQuestions: template.totalQuestions,
          examDurationMinutes: template.examDurationMinutes,
          passingScore: template.passingScore,
          providerId,
          examBoardId,
          userId,
          isTemplate: false,
          sections: {
            create: template.sections.map((s) => ({
              name: s.name,
              minQuestions: s.minQuestions,
              maxQuestions: s.maxQuestions,
              topics: s.topics.length
                ? { create: s.topics.map((t) => ({ name: t.name })) }
                : undefined,
            })),
          },
        },
      });

      return forked.id;
    });
  }

  public async promoteExam(examId: string): Promise<void> {
    const exam = await this.prismaService.exam.findFirst({
      where: { id: examId },
      include: { sections: { include: { topics: true } } },
    });

    if (!exam) {
      throw Object.assign(new Error('Exam not found'), { status: 404 });
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.exam.update({ where: { id: examId }, data: { isTemplate: true } });

      for (const section of exam.sections) {
        if (section.topics.length === 0) {
          await tx.questionPool.upsert({
            where: {
              type_providerId_examBoardId_sectionName_topicName: {
                type: exam.type,
                providerId: exam.providerId ?? '',
                examBoardId: exam.examBoardId ?? '',
                sectionName: section.name,
                topicName: '',
              },
            },
            update: {},
            create: {
              type: exam.type,
              providerId: exam.providerId ?? null,
              examBoardId: exam.examBoardId ?? null,
              sectionName: section.name,
              topicName: null,
            },
          });
        }

        for (const topic of section.topics) {
          const pool = await tx.questionPool.upsert({
            where: {
              type_providerId_examBoardId_sectionName_topicName: {
                type: exam.type,
                providerId: exam.providerId ?? '',
                examBoardId: exam.examBoardId ?? '',
                sectionName: section.name,
                topicName: topic.name,
              },
            },
            update: {},
            create: {
              type: exam.type,
              providerId: exam.providerId ?? null,
              examBoardId: exam.examBoardId ?? null,
              sectionName: section.name,
              topicName: topic.name,
            },
          });

          await tx.examQuestion.updateMany({
            where: {
              poolId: null,
              sectionName: section.name,
              topicName: topic.name,
              exam: {
                OR: [
                  ...(exam.providerId ? [{ providerId: exam.providerId }] : []),
                  ...(exam.examBoardId ? [{ examBoardId: exam.examBoardId }] : []),
                ],
              },
            },
            data: { poolId: pool.id },
          });
        }
      }
    });
  }

  public async getAdminCatalogEntries(): Promise<AdminCatalogEntry[]> {
    const exams = await this.prismaService.exam.findMany({
      include: {
        provider: true,
        examBoard: true,
        sections: { select: { id: true } },
        user: { select: { email: true } },
        questions: { select: { id: true } },
      },
      orderBy: [{ isTemplate: 'desc' }, { updatedAt: 'desc' }],
      take: 200,
    });

    return exams.map((e) => ({
      id: e.id,
      type: e.type as ExamType,
      name: e.name,
      role: e.role,
      year: e.year,
      provider: e.provider,
      examBoard: e.examBoard,
      isTemplate: e.isTemplate,
      userId: e.userId,
      ownerEmail: e.user?.email ?? null,
      sectionCount: e.sections.length,
      questionCount: e.questions.length,
    }));
  }
}
