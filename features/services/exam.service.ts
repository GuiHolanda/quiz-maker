import { prisma, PrismaService } from '@/lib/prisma';
import { Exam, ExamType, SectionUpdatePayload } from '@/shared/types';
import { normalizeName } from '@/shared/utils';

export class ExamService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public validate(body: unknown): Exam {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }

    const { type, name, role, year, key, totalQuestions, examDurationMinutes, passingScore, provider, examBoard, sections } =
      body as Record<string, unknown>;

    if (type !== 'certification' && type !== 'public_exam') {
      throw Object.assign(new Error('type must be "certification" or "public_exam"'), { status: 400 });
    }

    if (!name || typeof name !== 'string') {
      throw new Error('Exam name is required');
    }

    if (!totalQuestions || typeof totalQuestions !== 'number' || totalQuestions < 1) {
      throw Object.assign(new Error('totalQuestions is required and must be a positive integer'), { status: 400 });
    }

    if (!Array.isArray(sections) || sections.length === 0) {
      throw new Error('At least one section is required');
    }

    for (const section of sections) {
      if (!section.name || typeof section.name !== 'string') {
        throw new Error('Each section must have a valid name');
      }
      if (typeof section.minQuestions !== 'number' || typeof section.maxQuestions !== 'number') {
        throw new TypeError('Each section must have valid minQuestions and maxQuestions');
      }
    }

    const providerRecord = provider as Record<string, unknown> | null | undefined;
    const boardRecord = examBoard as Record<string, unknown> | null | undefined;

    return {
      type: type as ExamType,
      name: normalizeName(name),
      role: typeof role === 'string' && role.trim() ? normalizeName(role) : null,
      year: typeof year === 'number' ? year : null,
      key: typeof key === 'string' && key.trim() ? key.trim() : null,
      totalQuestions: Math.round(totalQuestions),
      examDurationMinutes:
        typeof examDurationMinutes === 'number' && examDurationMinutes > 0 ? Math.round(examDurationMinutes) : null,
      passingScore: typeof passingScore === 'number' && passingScore >= 0 && passingScore <= 100 ? passingScore : null,
      provider:
        providerRecord && typeof providerRecord.name === 'string'
          ? { name: normalizeName(providerRecord.name as string) }
          : null,
      examBoard:
        boardRecord && typeof boardRecord.name === 'string'
          ? {
              name: normalizeName(boardRecord.name as string),
              fullName:
                typeof boardRecord.fullName === 'string' && boardRecord.fullName.trim()
                  ? normalizeName(boardRecord.fullName as string)
                  : null,
            }
          : null,
      sections: sections as Exam['sections'],
    };
  }

  public async getExams(userId: string): Promise<Exam[]> {
    const exams = await this.prismaService.exam.findMany({
      where: { userId },
      include: { provider: true, examBoard: true, sections: { include: { topics: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return exams.map((exam) => this.toExam(exam));
  }

  public async save(exam: Exam, userId: string) {
    const { type, name, role, year, key, totalQuestions, examDurationMinutes, passingScore, provider, examBoard, sections } =
      exam;

    return this.prismaService.$transaction(async (tx) => {
      if (!key || !key.trim()) {
        throw Object.assign(new Error('key is required'), { status: 400 });
      }

      let providerId: string | null = null;
      let examBoardId: string | null = null;

      if (provider?.name) {
        const p = await tx.provider.upsert({
          where: { name: provider.name },
          update: {},
          create: { name: provider.name, fullName: provider.fullName ?? null },
        });

        providerId = p.id;
      }

      if (examBoard?.name) {
        const b = await tx.examBoard.upsert({
          where: { name: examBoard.name },
          update: {},
          create: { name: examBoard.name, fullName: examBoard.fullName ?? null },
        });

        examBoardId = b.id;
      }

      const existing = await tx.exam.findFirst({ where: { userId, type, name, role: role ?? null, year: year ?? null } });

      if (existing) {
        throw Object.assign(new Error(`Exam "${name}" already exists for this user`), { status: 409 });
      }

      const created = await tx.exam.create({
        data: {
          type,
          name,
          role: role ?? null,
          year: year ?? null,
          key: key.trim(),
          totalQuestions,
          examDurationMinutes: examDurationMinutes ?? null,
          passingScore: passingScore ?? null,
          providerId,
          examBoardId,
          userId,
          sections: {
            create: sections.map((section) => ({
              name: normalizeName(section.name),
              minQuestions: section.minQuestions,
              maxQuestions: section.maxQuestions,
              topics: section.topics?.length
                ? { create: section.topics.map((t) => ({ name: normalizeName(t.name) })) }
                : undefined,
            })),
          },
        },
        include: { provider: true, examBoard: true, sections: { include: { topics: true } } },
      });

      return this.toExam(created);
    });
  }

  public async deleteExam(examId: string, userId: string) {
    const exam = await this.prismaService.exam.findUnique({ where: { id: examId } });

    if (!exam) throw Object.assign(new Error('Exam not found'), { status: 404 });
    if (exam.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
    await this.prismaService.exam.delete({ where: { id: examId } });
  }

  // — Sections —

  public validateSectionUpdate(body: unknown): SectionUpdatePayload {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }

    const { sectionId, newName, minQuestions, maxQuestions } = body as Record<string, unknown>;

    if (!sectionId || typeof sectionId !== 'string') {
      throw new Error('sectionId is required');
    }
    if (newName !== undefined && typeof newName !== 'string') {
      throw new TypeError('newName must be a string');
    }
    if (typeof minQuestions !== 'number' || typeof maxQuestions !== 'number') {
      throw new TypeError('minQuestions and maxQuestions must be numbers');
    }

    return { sectionId, newName: typeof newName === 'string' ? newName : undefined, minQuestions, maxQuestions };
  }

  public async addSection(examId: string, name: string, minQuestions: number, maxQuestions: number, userId: string) {
    const exam = await this.prismaService.exam.findUnique({ where: { id: examId } });

    if (!exam) {
      throw Object.assign(new Error('Exam not found'), { status: 404 });
    }

    if (exam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const normalizedName = normalizeName(name);

    const existing = await this.prismaService.examSection.findUnique({
      where: { examId_name: { examId: exam.id, name: normalizedName } },
    });

    if (existing) {
      throw Object.assign(new Error(`Section "${normalizedName}" already exists`), { status: 409 });
    }

    const section = await this.prismaService.examSection.create({
      data: { name: normalizedName, minQuestions, maxQuestions, examId: exam.id },
    });

    await this.prismaService.exam.update({ where: { id: exam.id }, data: { updatedAt: new Date() } });

    return section;
  }

  public async updateSection(payload: SectionUpdatePayload, userId: string) {
    const { sectionId, newName, minQuestions, maxQuestions } = payload;

    const section = await this.prismaService.examSection.findUnique({
      where: { id: sectionId },
      include: { exam: true },
    });

    if (!section) {
      throw Object.assign(new Error('Section not found'), { status: 404 });
    }

    if (section.exam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const normalizedNewName = newName !== undefined ? normalizeName(newName) : undefined;

    // When renaming, migrate the denormalized ExamQuestion.sectionName snapshots
    // so historic questions stay linked. Use the sectionId FK as primary match,
    // falling back to a name match for any legacy rows.
    return this.prismaService.$transaction(async (tx) => {
      if (normalizedNewName !== undefined && normalizedNewName !== section.name) {
        await tx.examQuestion.updateMany({
          where: {
            userId,
            OR: [
              { sectionId: section.id },
              { sectionId: null, examName: section.exam.name, sectionName: section.name },
            ],
          },
          data: { sectionName: normalizedNewName },
        });
      }

      const updated = await tx.examSection.update({
        where: { id: sectionId },
        data: {
          ...(normalizedNewName !== undefined && { name: normalizedNewName }),
          minQuestions,
          maxQuestions,
        },
      });

      await tx.exam.update({ where: { id: section.exam.id }, data: { updatedAt: new Date() } });

      return updated;
    });
  }

  public async deleteSection(sectionId: string, userId: string) {
    const section = await this.prismaService.examSection.findUnique({
      where: { id: sectionId },
      include: { exam: true },
    });

    if (!section) {
      throw Object.assign(new Error('Section not found'), { status: 404 });
    }

    if (section.exam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    await this.prismaService.examSection.delete({ where: { id: sectionId } });

    await this.prismaService.exam.update({ where: { id: section.exam.id }, data: { updatedAt: new Date() } });
  }

  // — Topics —

  public async addTopic(sectionId: string, name: string, userId: string) {
    const section = await this.prismaService.examSection.findUnique({
      where: { id: sectionId },
      include: { exam: true },
    });

    if (!section) {
      throw Object.assign(new Error('Section not found'), { status: 404 });
    }

    if (section.exam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const normalizedName = normalizeName(name);

    const existing = await this.prismaService.examTopic.findUnique({
      where: { sectionId_name: { sectionId, name: normalizedName } },
    });

    if (existing) {
      throw Object.assign(new Error(`Topic "${normalizedName}" already exists`), { status: 409 });
    }

    const topic = await this.prismaService.examTopic.create({ data: { name: normalizedName, sectionId } });

    await this.prismaService.exam.update({ where: { id: section.exam.id }, data: { updatedAt: new Date() } });

    return topic;
  }

  public async updateTopic(topicId: string, newName: string, userId: string) {
    const topic = await this.prismaService.examTopic.findUnique({
      where: { id: topicId },
      include: { section: { include: { exam: true } } },
    });

    if (!topic) {
      throw Object.assign(new Error('Topic not found'), { status: 404 });
    }

    if (topic.section.exam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const normalizedNewName = normalizeName(newName);

    const duplicate = await this.prismaService.examTopic.findUnique({
      where: { sectionId_name: { sectionId: topic.sectionId, name: normalizedNewName } },
    });

    if (duplicate && duplicate.id !== topicId) {
      throw Object.assign(new Error(`Topic "${normalizedNewName}" already exists`), { status: 409 });
    }

    // Mirror the rename onto historic ExamQuestion.topicName snapshots. Scoped
    // by topicId FK, falling back to section + exam + name for legacy rows.
    return this.prismaService.$transaction(async (tx) => {
      if (normalizedNewName !== topic.name) {
        await tx.examQuestion.updateMany({
          where: {
            userId,
            OR: [
              { topicId: topic.id },
              {
                topicId: null,
                examName: topic.section.exam.name,
                sectionName: topic.section.name,
                topicName: topic.name,
              },
            ],
          },
          data: { topicName: normalizedNewName },
        });
      }

      const updated = await tx.examTopic.update({ where: { id: topicId }, data: { name: normalizedNewName } });

      await tx.exam.update({ where: { id: topic.section.exam.id }, data: { updatedAt: new Date() } });

      return updated;
    });
  }

  public async deleteTopic(topicId: string, userId: string) {
    const topic = await this.prismaService.examTopic.findUnique({
      where: { id: topicId },
      include: { section: { include: { exam: true } } },
    });

    if (!topic) {
      throw Object.assign(new Error('Topic not found'), { status: 404 });
    }

    if (topic.section.exam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    await this.prismaService.examTopic.delete({ where: { id: topicId } });

    await this.prismaService.exam.update({ where: { id: topic.section.exam.id }, data: { updatedAt: new Date() } });
  }

  // — Meta —

  public async updateExamMeta(
    examId: string,
    updates: {
      newName?: string;
      newRole?: string | null;
      newYear?: number | null;
      newKey?: string | null;
      newProviderName?: string | null;
      newExamBoardName?: string | null;
      newTotalQuestions?: number;
      newExamDurationMinutes?: number | null;
      newPassingScore?: number | null;
    },
    userId: string
  ) {
    const exam = await this.prismaService.exam.findUnique({ where: { id: examId } });

    if (!exam) {
      throw Object.assign(new Error('Exam not found'), { status: 404 });
    }

    if (exam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const normalizedNewName = updates.newName !== undefined ? normalizeName(updates.newName) : undefined;
    const normalizedNewRole =
      updates.newRole === null ? null : updates.newRole !== undefined ? normalizeName(updates.newRole) : undefined;
    const normalizedProviderName =
      updates.newProviderName === null
        ? null
        : updates.newProviderName !== undefined
          ? normalizeName(updates.newProviderName)
          : undefined;
    const normalizedBoardName =
      updates.newExamBoardName === null
        ? null
        : updates.newExamBoardName !== undefined
          ? normalizeName(updates.newExamBoardName)
          : undefined;

    return this.prismaService.$transaction(async (tx) => {
      let providerId: string | null | undefined;
      let examBoardId: string | null | undefined;

      if (normalizedProviderName) {
        const p = await tx.provider.upsert({
          where: { name: normalizedProviderName },
          update: {},
          create: { name: normalizedProviderName },
        });

        providerId = p.id;
      } else if (normalizedProviderName === null) {
        providerId = null;
      }

      if (normalizedBoardName) {
        const b = await tx.examBoard.upsert({
          where: { name: normalizedBoardName },
          update: {},
          create: { name: normalizedBoardName },
        });

        examBoardId = b.id;
      } else if (normalizedBoardName === null) {
        examBoardId = null;
      }

      // Mirror exam-level renames onto historic ExamQuestion snapshots.
      if (normalizedNewName !== undefined && normalizedNewName !== exam.name) {
        await tx.examQuestion.updateMany({
          where: {
            userId,
            OR: [{ examId: exam.id }, { examId: null, examName: exam.name }],
          },
          data: { examName: normalizedNewName },
        });
      }

      const updated = await tx.exam.update({
        where: { id: examId },
        data: {
          ...(normalizedNewName !== undefined && { name: normalizedNewName }),
          ...(normalizedNewRole !== undefined && { role: normalizedNewRole }),
          ...(updates.newYear !== undefined && { year: updates.newYear }),
          ...(updates.newKey !== undefined && { key: updates.newKey }),
          ...(providerId !== undefined && { providerId }),
          ...(examBoardId !== undefined && { examBoardId }),
          ...(updates.newTotalQuestions !== undefined && { totalQuestions: updates.newTotalQuestions }),
          ...(updates.newExamDurationMinutes !== undefined && { examDurationMinutes: updates.newExamDurationMinutes }),
          ...(updates.newPassingScore !== undefined && { passingScore: updates.newPassingScore }),
        },
        include: { provider: true, examBoard: true, sections: { include: { topics: true } } },
      });

      return this.toExam(updated);
    });
  }

  private toExam(row: any): Exam {
    return {
      id: row.id,
      type: row.type as ExamType,
      name: row.name,
      role: row.role,
      year: row.year,
      key: row.key ?? null,
      totalQuestions: row.totalQuestions,
      examDurationMinutes: row.examDurationMinutes,
      passingScore: row.passingScore,
      createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
      updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
      provider: row.provider ?? null,
      examBoard: row.examBoard ?? null,
      sections: (row.sections ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        minQuestions: s.minQuestions,
        maxQuestions: s.maxQuestions,
        topics: (s.topics ?? []).map((t: any) => ({ id: t.id, name: t.name })),
      })),
    };
  }
}
