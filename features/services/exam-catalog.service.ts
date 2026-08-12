import { prisma, PrismaService } from '@/lib/prisma';
import type { CatalogExam, AdminCatalogEntry, AdminCatalogExamDetail, ExamType, ExamSection, Exam } from '@/shared/types';

export class ExamCatalogService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public async getTemplates(userId: string): Promise<CatalogExam[]> {
    const [templates, userExams] = await Promise.all([
      this.prismaService.exam.findMany({
        where: { isTemplate: true },
        include: {
          provider: true,
          examBoard: true,
          sections: { include: { topics: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prismaService.exam.findMany({
        where: { userId, isTemplate: false },
        select: { name: true, type: true },
      }),
    ]);

    const userExamKeys = new Set(userExams.map((e) => `${e.type}::${e.name}`));
    const visible = templates.filter((t) => !userExamKeys.has(`${t.type}::${t.name}`));

    const poolCounts = await this.prismaService.examQuestion.groupBy({
      by: ['examId'],
      where: {
        examId: { in: visible.map((t) => t.id) },
        poolId: { not: null },
      },
      _count: { id: true },
    });

    const countByExam = new Map(poolCounts.map((r) => [r.examId!, r._count.id]));

    return visible.map((t) => ({
      id: t.id,
      type: t.type as ExamType,
      name: t.name,
      role: t.role,
      year: t.year,
      key: t.key,
      totalQuestions: t.totalQuestions,
      examDurationMinutes: t.examDurationMinutes,
      passingScore: t.passingScore,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
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

  public async forkExam(templateId: string, userId: string): Promise<Exam> {
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
        include: { provider: true, examBoard: true, sections: { include: { topics: true } } },
      });

      await this.ensurePoolEntries(
        tx,
        { type: forked.type, providerId: providerId ?? null, examBoardId: examBoardId ?? null },
        template.sections
      );

      return {
        id: forked.id,
        type: forked.type as Exam['type'],
        name: forked.name,
        role: forked.role,
        year: forked.year,
        key: forked.key,
        totalQuestions: forked.totalQuestions,
        examDurationMinutes: forked.examDurationMinutes,
        passingScore: forked.passingScore,
        provider: forked.provider ?? null,
        examBoard: forked.examBoard ?? null,
        createdAt: forked.createdAt.toISOString(),
        updatedAt: forked.updatedAt.toISOString(),
        sections: forked.sections.map((s) => ({
          id: s.id,
          name: s.name,
          minQuestions: s.minQuestions,
          maxQuestions: s.maxQuestions,
          topics: s.topics.map((t) => ({ id: t.id, name: t.name })),
        })),
      };
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

      const poolKey = {
        type: exam.type,
        providerId: exam.providerId ?? null,
        examBoardId: exam.examBoardId ?? null,
      };

      await this.ensurePoolEntries(tx, poolKey, exam.sections);

      const ownerFilter = {
        OR: [
          ...(exam.providerId ? [{ providerId: exam.providerId }] : []),
          ...(exam.examBoardId ? [{ examBoardId: exam.examBoardId }] : []),
        ],
      };

      for (const section of exam.sections) {
        if (section.topics.length === 0) {
          const sectionPool = await tx.questionPool.findFirst({
            where: { ...poolKey, sectionName: section.name, topicName: null },
          });

          await tx.examQuestion.updateMany({
            where: { poolId: null, sectionName: section.name, topicName: null, exam: ownerFilter },
            data: { poolId: sectionPool!.id },
          });
        }

        for (const topic of section.topics) {
          const pool = await tx.questionPool.findFirst({
            where: { ...poolKey, sectionName: section.name, topicName: topic.name },
          });

          await tx.examQuestion.updateMany({
            where: { poolId: null, sectionName: section.name, topicName: topic.name, exam: ownerFilter },
            data: { poolId: pool!.id },
          });
        }
      }
    });
  }

  private async ensurePoolEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    poolKey: { type: string; providerId: string | null; examBoardId: string | null },
    sections: Array<{ name: string; topics: Array<{ name: string }> }>
  ): Promise<void> {
    for (const section of sections) {
      if (section.topics.length === 0) {
        const existing = await tx.questionPool.findFirst({
          where: { ...poolKey, sectionName: section.name, topicName: null },
        });
        if (!existing) {
          await tx.questionPool.create({
            data: { ...poolKey, sectionName: section.name, topicName: null },
          });
        }
      }

      for (const topic of section.topics) {
        const existing = await tx.questionPool.findFirst({
          where: { ...poolKey, sectionName: section.name, topicName: topic.name },
        });
        if (!existing) {
          await tx.questionPool.create({
            data: { ...poolKey, sectionName: section.name, topicName: topic.name },
          });
        }
      }
    }
  }

  public async getAdminExamDetail(examId: string): Promise<AdminCatalogExamDetail> {
    const exam = await this.prismaService.exam.findFirst({
      where: { id: examId },
      include: {
        provider: true,
        examBoard: true,
        sections: { include: { topics: true } },
        user: { select: { email: true } },
        questions: { select: { id: true } },
      },
    });

    if (!exam) {
      throw Object.assign(new Error('Exam not found'), { status: 404 });
    }

    const poolCount = await this.prismaService.examQuestion.count({
      where: { examId, poolId: { not: null } },
    });

    return {
      id: exam.id,
      type: exam.type as ExamType,
      name: exam.name,
      role: exam.role,
      year: exam.year,
      key: exam.key,
      totalQuestions: exam.totalQuestions,
      examDurationMinutes: exam.examDurationMinutes,
      passingScore: exam.passingScore,
      isTemplate: exam.isTemplate,
      ownerEmail: exam.user?.email ?? null,
      createdAt: exam.createdAt.toISOString(),
      updatedAt: exam.updatedAt.toISOString(),
      provider: exam.provider,
      examBoard: exam.examBoard,
      sections: exam.sections.map((s) => ({
        id: s.id,
        name: s.name,
        minQuestions: s.minQuestions,
        maxQuestions: s.maxQuestions,
        topics: s.topics.map((t) => ({ id: t.id, name: t.name })),
      })) as ExamSection[],
      questionCount: exam.questions.length,
      poolQuestionCount: poolCount,
    };
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
