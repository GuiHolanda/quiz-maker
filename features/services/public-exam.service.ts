import { prisma, PrismaService } from '@/lib/prisma';
import { PublicExam, PublicExamSubjectUpdatePayload } from '@/shared/types';

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
      name: name.trim(),
      role: typeof role === 'string' && role.trim() ? role.trim() : undefined,
      year: typeof year === 'number' ? year : undefined,
      examBoard: {
        name: (board.name as string).trim(),
        fullName: typeof board.fullName === 'string' && board.fullName.trim() ? board.fullName.trim() : undefined,
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
              name: subject.name,
              minQuestions: subject.minQuestions,
              maxQuestions: subject.maxQuestions,
              topics: subject.topics?.length
                ? { create: subject.topics.map((t) => ({ name: t.name })) }
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

    return this.prismaService.publicExamSubject.update({
      where: { id: subjectId },
      data: {
        ...(newName !== undefined && { name: newName }),
        minQuestions,
        maxQuestions,
      },
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
    userId: string,
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

    const existing = await this.prismaService.publicExamSubject.findUnique({
      where: { publicExamId_name: { publicExamId: exam.id, name } },
    });

    if (existing) {
      throw Object.assign(new Error(`Subject "${name}" already exists`), { status: 409 });
    }

    return this.prismaService.publicExamSubject.create({
      data: { name, minQuestions, maxQuestions, publicExamId: exam.id },
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

    const existing = await this.prismaService.publicExamTopic.findUnique({
      where: { subjectId_name: { subjectId, name } },
    });

    if (existing) {
      throw Object.assign(new Error(`Topic "${name}" already exists`), { status: 409 });
    }

    return this.prismaService.publicExamTopic.create({
      data: { name, subjectId },
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

    const duplicate = await this.prismaService.publicExamTopic.findUnique({
      where: { subjectId_name: { subjectId: topic.subjectId, name: newName } },
    });

    if (duplicate && duplicate.id !== topicId) {
      throw Object.assign(new Error(`Topic "${newName}" already exists`), { status: 409 });
    }

    return this.prismaService.publicExamTopic.update({
      where: { id: topicId },
      data: { name: newName },
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
    userId: string,
  ) {
    const exam = await this.prismaService.publicExam.findUnique({ where: { id: publicExamId } });

    if (!exam) {
      throw Object.assign(new Error('Public exam not found'), { status: 404 });
    }

    if (exam.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    let newExamBoardId: string | undefined;
    if (updates.newExamBoardName) {
      const board = await this.prismaService.examBoard.upsert({
        where: { name: updates.newExamBoardName },
        update: {},
        create: { name: updates.newExamBoardName },
      });
      newExamBoardId = board.id;
    }

    return this.prismaService.publicExam.update({
      where: { id: publicExamId },
      data: {
        ...(updates.newName !== undefined && { name: updates.newName }),
        ...(updates.newRole !== undefined && { role: updates.newRole }),
        ...(updates.newYear !== undefined && { year: updates.newYear }),
        ...(newExamBoardId && { examBoardId: newExamBoardId }),
      },
      include: {
        examBoard: true,
        subjects: { include: { topics: true } },
      },
    });
  }
}
