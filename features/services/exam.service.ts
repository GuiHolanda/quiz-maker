import { prisma, PrismaService } from '@/lib/prisma';
import { defaultFormatForSource, isQuestionFormatKey, resolveQuestionFormat } from '@/config/question-formats';
import { Exam, ExamType, SectionUpdatePayload } from '@/shared/types';
import { normalizeName } from '@/shared/utils';

function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeName(item.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export class ExamService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public validate(body: unknown): Exam {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }

    const {
      type,
      name,
      role,
      year,
      key,
      totalQuestions,
      examDurationMinutes,
      passingScore,
      questionFormat,
      provider,
      examBoard,
      sections,
    } = body as Record<string, unknown>;

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
      // An unrecognized key falls back to the writing body's usual style, then to mc_5,
      // so a client that omits the field still lands on a sensible format.
      questionFormat: isQuestionFormatKey(questionFormat)
        ? questionFormat
        : defaultFormatForSource(
            (boardRecord?.name as string | undefined) ?? (providerRecord?.name as string | undefined)
          ),
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
    const {
      type,
      name,
      role,
      year,
      key,
      totalQuestions,
      examDurationMinutes,
      passingScore,
      questionFormat,
      provider,
      examBoard,
      sections,
    } = exam;

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

      const existing = await tx.exam.findFirst({
        where: { userId, type, name, role: role ?? null, year: year ?? null },
      });

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
          ...(questionFormat ? { questionFormat } : {}),
          providerId,
          examBoardId,
          userId,
          sections: {
            create: dedupeByName(sections).map((section) => ({
              name: normalizeName(section.name),
              minQuestions: section.minQuestions,
              maxQuestions: section.maxQuestions,
              topics: section.topics?.length
                ? { create: dedupeByName(section.topics).map((t) => ({ name: normalizeName(t.name) })) }
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

    await this.prismaService.$transaction(async (tx) => {
      const mockExams = await tx.mockExam.findMany({ where: { examId }, select: { id: true } });
      const mockExamIds = mockExams.map((m) => m.id);

      if (mockExamIds.length > 0) {
        // MockExamAttemptAnswer.mockExamQuestionId → MockExamQuestion has no onDelete:
        // delete answers first, then MockExam (which cascades MockExamQuestion), then Exam.
        await tx.mockExamAttemptAnswer.deleteMany({
          where: { mockExamQuestion: { mockExamId: { in: mockExamIds } } },
        });
        await tx.mockExam.deleteMany({ where: { id: { in: mockExamIds } } });
      }

      await tx.exam.delete({ where: { id: examId } });
    });
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

  // — Full update (Fase 3: same editor used pre- and post-save) —

  public async updateExam(examId: string, exam: Exam, userId: string): Promise<Exam> {
    const existing = await this.prismaService.exam.findUnique({
      where: { id: examId },
      include: { sections: { include: { topics: true } } },
    });

    if (!existing) {
      throw Object.assign(new Error('Exam not found'), { status: 404 });
    }

    if (existing.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const {
      name,
      role,
      year,
      key,
      totalQuestions,
      examDurationMinutes,
      passingScore,
      questionFormat,
      provider,
      examBoard,
      sections,
    } = exam;

    const normalizedName = normalizeName(name);
    const normalizedRole = role && role.trim() ? normalizeName(role) : null;
    const normalizedYear = year ?? null;

    return this.prismaService.$transaction(async (tx) => {
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

      if (normalizedName !== existing.name || normalizedRole !== existing.role || normalizedYear !== existing.year) {
        const duplicate = await tx.exam.findFirst({
          where: {
            userId,
            type: existing.type,
            name: normalizedName,
            role: normalizedRole,
            year: normalizedYear,
            NOT: { id: examId },
          },
        });

        if (duplicate) {
          throw Object.assign(new Error(`Exam "${normalizedName}" already exists for this user`), { status: 409 });
        }
      }

      // Mirror exam-level rename onto historic ExamQuestion snapshots, same as updateExamMeta.
      if (normalizedName !== existing.name) {
        await tx.examQuestion.updateMany({
          where: { userId, OR: [{ examId: existing.id }, { examId: null, examName: existing.name }] },
          data: { examName: normalizedName },
        });
      }

      const existingSectionById = new Map(existing.sections.map((s) => [s.id, s]));
      const keptSectionIds = new Set<string>();

      for (const section of dedupeByName(sections)) {
        const normalizedSectionName = normalizeName(section.name);
        const matchedSection = section.id ? existingSectionById.get(section.id) : undefined;

        if (matchedSection) {
          keptSectionIds.add(matchedSection.id);

          if (normalizedSectionName !== matchedSection.name) {
            await tx.examQuestion.updateMany({
              where: {
                userId,
                OR: [
                  { sectionId: matchedSection.id },
                  { sectionId: null, examName: existing.name, sectionName: matchedSection.name },
                ],
              },
              data: { sectionName: normalizedSectionName },
            });
          }

          await tx.examSection.update({
            where: { id: matchedSection.id },
            data: {
              name: normalizedSectionName,
              minQuestions: section.minQuestions,
              maxQuestions: section.maxQuestions,
            },
          });

          const existingTopicById = new Map(matchedSection.topics.map((t) => [t.id, t]));
          const keptTopicIds = new Set<string>();

          for (const topic of dedupeByName(section.topics ?? [])) {
            const normalizedTopicName = normalizeName(topic.name);
            const matchedTopic = topic.id ? existingTopicById.get(topic.id) : undefined;

            if (matchedTopic) {
              keptTopicIds.add(matchedTopic.id);

              if (normalizedTopicName !== matchedTopic.name) {
                await tx.examQuestion.updateMany({
                  where: {
                    userId,
                    OR: [
                      { topicId: matchedTopic.id },
                      {
                        topicId: null,
                        examName: existing.name,
                        sectionName: matchedSection.name,
                        topicName: matchedTopic.name,
                      },
                    ],
                  },
                  data: { topicName: normalizedTopicName },
                });
                await tx.examTopic.update({ where: { id: matchedTopic.id }, data: { name: normalizedTopicName } });
              }
            } else {
              await tx.examTopic.create({ data: { name: normalizedTopicName, sectionId: matchedSection.id } });
            }
          }

          const topicsToDelete = matchedSection.topics.filter((t) => !keptTopicIds.has(t.id));

          if (topicsToDelete.length > 0) {
            await tx.examTopic.deleteMany({ where: { id: { in: topicsToDelete.map((t) => t.id) } } });
          }
        } else {
          await tx.examSection.create({
            data: {
              name: normalizedSectionName,
              minQuestions: section.minQuestions,
              maxQuestions: section.maxQuestions,
              examId,
              topics: dedupeByName(section.topics ?? []).length
                ? { create: dedupeByName(section.topics ?? []).map((t) => ({ name: normalizeName(t.name) })) }
                : undefined,
            },
          });
        }
      }

      const sectionsToDelete = existing.sections.filter((s) => !keptSectionIds.has(s.id));

      if (sectionsToDelete.length > 0) {
        await tx.examSection.deleteMany({ where: { id: { in: sectionsToDelete.map((s) => s.id) } } });
      }

      const updated = await tx.exam.update({
        where: { id: examId },
        data: {
          name: normalizedName,
          role: normalizedRole,
          year: normalizedYear,
          key: key && key.trim() ? key.trim() : null,
          totalQuestions,
          examDurationMinutes: examDurationMinutes ?? null,
          passingScore: passingScore ?? null,
          ...(questionFormat ? { questionFormat } : {}),
          providerId,
          examBoardId,
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
      questionFormat: resolveQuestionFormat(row.questionFormat).key,
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
