import { prismaMock } from '../__mocks__/prisma';
import { ExamService } from '@/features/services/exam.service';
import type { Exam } from '@/shared/types';

describe('ExamService', () => {
  it('creates a certification exam with flat sections', async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.exam.findFirst.mockResolvedValue(null as any);
    prismaMock.provider.upsert.mockResolvedValue({ id: 'p1', name: 'AWS' } as any);
    prismaMock.exam.create.mockResolvedValue({ id: 'e1' } as any);
    const service = new ExamService(prismaMock as any);
    await service.save(
      {
        type: 'certification',
        name: 'AWS CCP',
        key: 'TEST-01',
        totalQuestions: 65,
        provider: { name: 'AWS' },
        sections: [{ name: 'Cloud Concepts', minQuestions: 20, maxQuestions: 30 }],
      } as any,
      'user1',
    );
    expect(prismaMock.exam.create).toHaveBeenCalled();
    const arg = prismaMock.exam.create.mock.calls[0][0];
    expect(arg.data.type).toBe('certification');
  });

  describe('save()', () => {
    it('throws 400 when key is missing', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));

      const exam: Exam = {
        type: 'certification',
        name: 'AWS SAA',
        key: null,
        totalQuestions: 65,
        sections: [{ name: 'Security', minQuestions: 30, maxQuestions: 30, topics: [] }],
      };

      const service = new ExamService(prismaMock as any);
      await expect(service.save(exam, 'user-1')).rejects.toMatchObject({ status: 400 });
    });

    it('throws 400 when key is empty string', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));

      const exam: Exam = {
        type: 'certification',
        name: 'AWS SAA',
        key: '   ',
        totalQuestions: 65,
        sections: [{ name: 'Security', minQuestions: 30, maxQuestions: 30, topics: [] }],
      };

      const service = new ExamService(prismaMock as any);
      await expect(service.save(exam, 'user-1')).rejects.toMatchObject({ status: 400 });
    });

    it('includes role in uniqueness check', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.exam.findFirst.mockResolvedValue(null as any);
      prismaMock.exam.create.mockResolvedValue({
        id: 'exam-1',
        type: 'public_exam',
        name: 'Concurso TRF 2025',
        role: 'Analista',
        year: 2025,
        key: '001/2025',
        totalQuestions: 80,
        examDurationMinutes: null,
        passingScore: null,
        providerId: null,
        examBoardId: null,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        provider: null,
        examBoard: null,
        sections: [],
      } as any);

      const exam: Exam = {
        type: 'public_exam',
        name: 'Concurso TRF 2025',
        role: 'Analista',
        year: 2025,
        key: '001/2025',
        totalQuestions: 80,
        sections: [],
      };

      const service = new ExamService(prismaMock as any);
      await service.save(exam, 'user-1');

      expect(prismaMock.exam.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', type: 'public_exam', name: 'Concurso TRF 2025', role: 'Analista', year: 2025 },
      });
    });
  });

  describe('deleteExam()', () => {
    it('deletes associated MockExamAttemptAnswers and MockExams in a transaction before deleting the Exam', async () => {
      prismaMock.exam.findUnique.mockResolvedValue({
        id: 'exam-del',
        userId: 'user-1',
        name: 'AWS SAA',
      } as any);
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.mockExam.findMany.mockResolvedValue([
        { id: 'mock-1' },
        { id: 'mock-2' },
      ] as any);
      prismaMock.mockExamAttemptAnswer.deleteMany.mockResolvedValue({ count: 5 } as any);
      prismaMock.mockExam.deleteMany.mockResolvedValue({ count: 2 } as any);
      prismaMock.exam.delete.mockResolvedValue({} as any);

      const service = new ExamService(prismaMock as any);
      await service.deleteExam('exam-del', 'user-1');

      // attempt answers must be cleared first (FK constraint workaround for SQLite)
      expect(prismaMock.mockExamAttemptAnswer.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { mockExamQuestion: { mockExamId: { in: ['mock-1', 'mock-2'] } } },
        }),
      );
      expect(prismaMock.mockExam.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['mock-1', 'mock-2'] } } });
      expect(prismaMock.exam.delete).toHaveBeenCalledWith({ where: { id: 'exam-del' } });
    });

    it('skips MockExam cleanup and deletes directly when exam has no simulados', async () => {
      prismaMock.exam.findUnique.mockResolvedValue({
        id: 'exam-no-mocks',
        userId: 'user-1',
        name: 'Azure AZ-900',
      } as any);
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.mockExam.findMany.mockResolvedValue([]); // no mock exams
      prismaMock.exam.delete.mockResolvedValue({} as any);

      const service = new ExamService(prismaMock as any);
      await service.deleteExam('exam-no-mocks', 'user-1');

      expect(prismaMock.mockExamAttemptAnswer.deleteMany).not.toHaveBeenCalled();
      expect(prismaMock.mockExam.deleteMany).not.toHaveBeenCalled();
      expect(prismaMock.exam.delete).toHaveBeenCalledWith({ where: { id: 'exam-no-mocks' } });
    });

    it('throws 403 when userId does not match exam owner', async () => {
      prismaMock.exam.findUnique.mockResolvedValue({
        id: 'exam-other',
        userId: 'user-owner',
        name: 'AWS SAA',
      } as any);

      const service = new ExamService(prismaMock as any);
      await expect(service.deleteExam('exam-other', 'user-attacker')).rejects.toMatchObject({ status: 403 });
    });

    it('throws 404 when exam does not exist', async () => {
      prismaMock.exam.findUnique.mockResolvedValue(null);

      const service = new ExamService(prismaMock as any);
      await expect(service.deleteExam('missing', 'user-1')).rejects.toMatchObject({ status: 404 });
    });
  });

  it('propagates updatedAt to parent Exam when renaming a section', async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.examSection.findUnique.mockResolvedValue({
      id: 's1',
      name: 'Old',
      exam: { id: 'e1', userId: 'user1', name: 'AWS CCP' },
    } as any);
    prismaMock.examSection.update.mockResolvedValue({ id: 's1', examId: 'e1', name: 'New' } as any);
    prismaMock.examQuestion.updateMany.mockResolvedValue({ count: 3 } as any);
    prismaMock.exam.update.mockResolvedValue({ id: 'e1' } as any);
    const service = new ExamService(prismaMock as any);
    await service.updateSection({ sectionId: 's1', newName: 'New', minQuestions: 10, maxQuestions: 20 }, 'user1');
    expect(prismaMock.examQuestion.updateMany).toHaveBeenCalled();
    expect(prismaMock.exam.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'e1' } }));
  });

  describe('validate() — questionFormat', () => {
    const body = (overrides: Record<string, unknown> = {}) => ({
      type: 'public_exam',
      name: 'TRF 1',
      totalQuestions: 80,
      sections: [{ name: 'Direito Administrativo', minQuestions: 20, maxQuestions: 30 }],
      ...overrides,
    });

    it('keeps an explicit format chosen by the user', () => {
      const service = new ExamService(prismaMock as any);

      expect(service.validate(body({ questionFormat: 'mc_4' })).questionFormat).toBe('mc_4');
    });

    it('defaults a Cebraspe exam to Certo/Errado when no format is sent', () => {
      const service = new ExamService(prismaMock as any);

      expect(service.validate(body({ examBoard: { name: 'Cebraspe' } })).questionFormat).toBe('true_false');
    });

    it('lets an explicit choice override the exam board default', () => {
      // The board map is a starting point, not a rule — Cebraspe also runs
      // multiple-choice provas, so the user's pick wins.
      const service = new ExamService(prismaMock as any);
      const parsed = service.validate(body({ examBoard: { name: 'Cebraspe' }, questionFormat: 'mc_5' }));

      expect(parsed.questionFormat).toBe('mc_5');
    });

    it('falls back to mc_5 for an unmapped board and for a bogus key', () => {
      const service = new ExamService(prismaMock as any);

      expect(service.validate(body({ examBoard: { name: 'FGV' } })).questionFormat).toBe('mc_5');
      expect(service.validate(body({ questionFormat: 'mc_9' })).questionFormat).toBe('mc_5');
      expect(service.validate(body()).questionFormat).toBe('mc_5');
    });

    it('reads the certification provider when there is no exam board', () => {
      const service = new ExamService(prismaMock as any);
      const parsed = service.validate(body({ type: 'certification', provider: { name: 'CESPE Certificações' } }));

      expect(parsed.questionFormat).toBe('true_false');
    });
  });
});
