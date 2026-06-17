import { prisma, PrismaService } from '@/lib/prisma';
import { PublicExam, PublicExamSubjectUpdatePayload } from '@/shared/types';
import { normalizeName } from '@/shared/utils';

export class PublicExamService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public validate(body: unknown): PublicExam {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }

    const { name, role, year, examBoard, subjects } = body as Record<string, unknown>;

    if (!name || typeof name !== 'string') {
      throw new Error('Public exam name is required');
    }

    if (!examBoard || typeof examBoard !== 'object') {
      throw new Error('Exam board is required');
    }

    const board = examBoard as Record<string, unknown>;

    if (!board.name || typeof board.name !== 'string') {
      throw new Error('Exam board name is required');
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      throw new Error('At least one subject is required');
    }

    for (const subject of subjects) {
      if (!subject.name || typeof subject.name !== 'string') {
        throw new Error('Each subject must have a valid name');
      }
      if (typeof subject.minQuestions !== 'number' || typeof subject.maxQuestions !== 'number') {
        throw new TypeError('Each subject must have valid minQuestions and maxQuestions');
      }
    }

    return {
      name: normalizeName(name),
      role: typeof role === 'string' && role.trim() ? normalizeName(role) : undefined,
      year: typeof year === 'number' ? year : undefined,
      examBoard: {
        name: normalizeName(board.name as string),
        fullName:
          typeof board.fullName === 'string' && board.fullName.trim() ? normalizeName(board.fullName) : undefined,
      },
      subjects: subjects as PublicExam['subjects'],
    };
  }

  public async save(publicExam: PublicExam, userId: string) {
    const { name, role, year, examBoard, subjects } = publicExam;

    return this.prismaService.$transaction(async (tx) => {
      // Resolve or create exam board (by name).
      let board = await tx.examBoard.findUnique({ where: { name: examBoard.name } });

      if (!board) {
        board = await tx.examBoard.create({
          data: { name: examBoard.name, fullName: examBoard.fullName ?? null },
        });
      }

      // Detect duplicate (userId + name + year).
      const existing = await tx.publicExam.findFirst({
        where: { userId, name, year: year ?? null },
      });

      if (existing) {
        throw Object.assign(new Error(`Public exam "${name}" already exists for this user`), { status: 409 });
      }

      const created = await tx.publicExam.create({
        data: {
          name,
          role: role ?? null,
          year: year ?? null,
          examBoardId: board.id,
          userId,
          subjects: {
            create: subjects.map((subject) => ({
              name: normalizeName(subject.name),
              minQuestions: subject.minQuestions,
              maxQuestions: subject.maxQuestions,
              topics: subject.topics?.length
                ? { create: subject.topics.map((t) => ({ name: normalizeName(t.name) })) }
                : undefined,
            })),
          },
        },
        include: {
          examBoard: true,
          subjects: { include: { topics: true } },
        },
      });

      return created;
    });
  }

  public validateSubjectUpdate(body: unknown): PublicExamSubjectUpdatePayload {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }

    const { subjectId, newName, minQuestions, maxQuestions } = body as Record<string, unknown>;

    if (!subjectId || typeof subjectId !== 'string') {
      throw new Error('subjectId is required');
    }
    if (newName !== undefined && typeof newName !== 'string') {
      throw new TypeError('newName must be a string');
    }
    if (typeof minQuestions !== 'number' || typeof maxQuestions !== 'number') {
      throw new TypeError('minQuestions and maxQuestions must be numbers');
    }

    return { subjectId, newName: typeof newName === 'string' ? newName : undefined, minQuestions, maxQuestions };
  }

  public async updateSubject(payload: PublicExamSubjectUpdatePayload, userId: string) {
    const { subjectId, newName, minQuestions, maxQuestions } = payload;

    const subject = await this.prismaService.publicExamSubject.findUnique({
      where: { id: subjectId },
      include: { publicExam: true },
    });

    if (!subject) {
      throw Object.assign(new Error('Subject not found'), { status: 404 });
    }

    if (subject.publicExam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const normalizedNewName = newName !== undefined ? normalizeName(newName) : undefined;

    // When renaming, also migrate the denormalized PublicExamQuestion.subject
    // string snapshots so historic questions stay linked to the configured
    // subject. Without this, questions silently orphan and the mock-exam
    // count query returns 0. Post Layer 5 we also have subjectId FKs, so
    // questions are reachable both ways during rollout.
    return this.prismaService.$transaction(async (tx) => {
      if (normalizedNewName !== undefined && normalizedNewName !== subject.name) {
        await tx.publicExamQuestion.updateMany({
          where: {
            userId,
            OR: [
              { subjectId: subject.id },
              { subjectId: null, publicExamName: subject.publicExam.name, subject: subject.name },
            ],
          },
          data: { subject: normalizedNewName },
        });
      }

      return tx.publicExamSubject.update({
        where: { id: subjectId },
        data: {
          ...(normalizedNewName !== undefined && { name: normalizedNewName }),
          minQuestions,
          maxQuestions,
        },
      });
    });
  }

  public async deletePublicExam(examId: string, userId: string) {
    const exam = await this.prismaService.publicExam.findUnique({ where: { id: examId } });

    if (!exam) throw Object.assign(new Error('Public exam not found'), { status: 404 });
    if (exam.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
    await this.prismaService.publicExam.delete({ where: { id: examId } });
  }

  public async deleteSubject(subjectId: string, userId: string) {
    const subject = await this.prismaService.publicExamSubject.findUnique({
      where: { id: subjectId },
      include: { publicExam: true },
    });

    if (!subject) {
      throw Object.assign(new Error('Subject not found'), { status: 404 });
    }

    if (subject.publicExam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    await this.prismaService.publicExamSubject.delete({ where: { id: subjectId } });
  }

  public async addSubject(
    publicExamId: string,
    name: string,
    minQuestions: number,
    maxQuestions: number,
    userId: string
  ) {
    const exam = await this.prismaService.publicExam.findUnique({
      where: { id: publicExamId },
    });

    if (!exam) {
      throw Object.assign(new Error('Public exam not found'), { status: 404 });
    }

    if (exam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const normalizedName = normalizeName(name);

    const existing = await this.prismaService.publicExamSubject.findUnique({
      where: { publicExamId_name: { publicExamId: exam.id, name: normalizedName } },
    });

    if (existing) {
      throw Object.assign(new Error(`Subject "${normalizedName}" already exists`), { status: 409 });
    }

    return this.prismaService.publicExamSubject.create({
      data: { name: normalizedName, minQuestions, maxQuestions, publicExamId: exam.id },
    });
  }

  public async addTopic(subjectId: string, name: string, userId: string) {
    const subject = await this.prismaService.publicExamSubject.findUnique({
      where: { id: subjectId },
      include: { publicExam: true },
    });

    if (!subject) {
      throw Object.assign(new Error('Subject not found'), { status: 404 });
    }

    if (subject.publicExam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const normalizedName = normalizeName(name);

    const existing = await this.prismaService.publicExamTopic.findUnique({
      where: { subjectId_name: { subjectId, name: normalizedName } },
    });

    if (existing) {
      throw Object.assign(new Error(`Topic "${normalizedName}" already exists`), { status: 409 });
    }

    return this.prismaService.publicExamTopic.create({
      data: { name: normalizedName, subjectId },
    });
  }

  public async updateTopic(topicId: string, newName: string, userId: string) {
    const topic = await this.prismaService.publicExamTopic.findUnique({
      where: { id: topicId },
      include: { subject: { include: { publicExam: true } } },
    });

    if (!topic) {
      throw Object.assign(new Error('Topic not found'), { status: 404 });
    }

    if (topic.subject.publicExam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const normalizedNewName = normalizeName(newName);

    const duplicate = await this.prismaService.publicExamTopic.findUnique({
      where: { subjectId_name: { subjectId: topic.subjectId, name: normalizedNewName } },
    });

    if (duplicate && duplicate.id !== topicId) {
      throw Object.assign(new Error(`Topic "${normalizedNewName}" already exists`), { status: 409 });
    }

    // Mirror the rename onto historic PublicExamQuestion rows that snapshot
    // the topic string. Scoped by subject + publicExamName + userId to avoid
    // touching same-named topics on other subjects. Post Layer 5 also use
    // topicId FK as the primary match.
    return this.prismaService.$transaction(async (tx) => {
      if (normalizedNewName !== topic.name) {
        await tx.publicExamQuestion.updateMany({
          where: {
            userId,
            OR: [
              { topicId: topic.id },
              {
                topicId: null,
                publicExamName: topic.subject.publicExam.name,
                subject: topic.subject.name,
                topic: topic.name,
              },
            ],
          },
          data: { topic: normalizedNewName },
        });
      }

      return tx.publicExamTopic.update({
        where: { id: topicId },
        data: { name: normalizedNewName },
      });
    });
  }

  public async deleteTopic(topicId: string, userId: string) {
    const topic = await this.prismaService.publicExamTopic.findUnique({
      where: { id: topicId },
      include: { subject: { include: { publicExam: true } } },
    });

    if (!topic) {
      throw Object.assign(new Error('Topic not found'), { status: 404 });
    }

    if (topic.subject.publicExam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    await this.prismaService.publicExamTopic.delete({ where: { id: topicId } });
  }

  public async updatePublicExamMeta(
    publicExamId: string,
    updates: { newName?: string; newRole?: string | null; newYear?: number | null; newExamBoardName?: string },
    userId: string
  ) {
    const exam = await this.prismaService.publicExam.findUnique({ where: { id: publicExamId } });

    if (!exam) {
      throw Object.assign(new Error('Public exam not found'), { status: 404 });
    }

    if (exam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const normalizedNewName = updates.newName !== undefined ? normalizeName(updates.newName) : undefined;
    const normalizedNewRole =
      updates.newRole === null ? null : updates.newRole !== undefined ? normalizeName(updates.newRole) : undefined;
    const normalizedNewBoardName =
      updates.newExamBoardName !== undefined ? normalizeName(updates.newExamBoardName) : undefined;

    return this.prismaService.$transaction(async (tx) => {
      let newExamBoardId: string | undefined;

      if (normalizedNewBoardName) {
        const board = await tx.examBoard.upsert({
          where: { name: normalizedNewBoardName },
          update: {},
          create: { name: normalizedNewBoardName },
        });

        newExamBoardId = board.id;
      }

      // Mirror exam-level renames onto historic PublicExamQuestion snapshots.
      // Use publicExamId FK when present; fall back to name match for any
      // legacy rows that haven't been backfilled yet.
      if (normalizedNewName !== undefined && normalizedNewName !== exam.name) {
        await tx.publicExamQuestion.updateMany({
          where: {
            userId,
            OR: [{ publicExamId: exam.id }, { publicExamId: null, publicExamName: exam.name }],
          },
          data: { publicExamName: normalizedNewName },
        });
      }

      if (normalizedNewBoardName !== undefined) {
        await tx.publicExamQuestion.updateMany({
          where: {
            userId,
            OR: [
              { publicExamId: exam.id },
              { publicExamId: null, publicExamName: normalizedNewName ?? exam.name },
            ],
          },
          data: { examBoardName: normalizedNewBoardName },
        });
      }

      return tx.publicExam.update({
        where: { id: publicExamId },
        data: {
          ...(normalizedNewName !== undefined && { name: normalizedNewName }),
          ...(normalizedNewRole !== undefined && { role: normalizedNewRole }),
          ...(updates.newYear !== undefined && { year: updates.newYear }),
          ...(newExamBoardId && { examBoardId: newExamBoardId }),
        },
        include: {
          examBoard: true,
          subjects: { include: { topics: true } },
        },
      });
    });
  }
}
