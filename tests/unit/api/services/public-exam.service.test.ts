import { prismaMock } from '../__mocks__/prisma';
import { PublicExamService } from '@/features/services/public-exam.service';

describe('PublicExamService', () => {
  let service: PublicExamService;

  beforeEach(() => {
    service = new PublicExamService(prismaMock as any);
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
  });

  // Behaviour 1: validate() throws when name is missing
  it('validate() throws when name is missing', () => {
    expect(() =>
      service.validate({
        examBoard: { name: 'CESGRANRIO' },
        subjects: [{ name: 'Math', minQuestions: 0.2, maxQuestions: 0.4 }],
      }),
    ).toThrow('Public exam name is required');
  });

  // Behaviour 2: validate() throws when subjects array is empty
  it('validate() throws when subjects array is empty', () => {
    expect(() =>
      service.validate({
        name: 'Concurso ABC',
        totalQuestions: 60,
        examBoard: { name: 'CESGRANRIO' },
        subjects: [],
      }),
    ).toThrow('At least one subject is required');
  });

  // Behaviour 3: save() upserts exam board by name
  it('save() creates a new exam board when none exists with that name', async () => {
    prismaMock.examBoard.findUnique.mockResolvedValue(null);
    prismaMock.examBoard.create.mockResolvedValue({ id: 'board-1', name: 'CESGRANRIO', fullName: null } as any);
    prismaMock.publicExam.findFirst.mockResolvedValue(null);
    prismaMock.publicExam.create.mockResolvedValue({
      id: 'exam-1',
      name: 'Concurso ABC',
      role: null,
      year: null,
      examBoardId: 'board-1',
      userId: 'user-1',
      examBoard: { id: 'board-1', name: 'CESGRANRIO', fullName: null },
      subjects: [],
    } as any);

    await service.save(
      {
        name: 'Concurso ABC',
        totalQuestions: 60,
        examBoard: { name: 'CESGRANRIO', fullName: undefined },
        subjects: [{ name: 'Math', minQuestions: 0.2, maxQuestions: 0.4 }],
      },
      'user-1',
    );

    expect(prismaMock.examBoard.create).toHaveBeenCalledWith({
      data: { name: 'CESGRANRIO', fullName: null },
    });
  });

  // Behaviour 4: updateSubject() mirrors rename onto PublicExamQuestion rows
  it('updateSubject() calls updateMany to mirror the rename onto PublicExamQuestion rows', async () => {
    prismaMock.publicExamSubject.findUnique.mockResolvedValue({
      id: 'sub-1',
      name: 'Matemática',
      publicExamId: 'exam-1',
      minQuestions: 0.2,
      maxQuestions: 0.4,
      publicExam: {
        id: 'exam-1',
        name: 'Concurso ABC',
        userId: 'user-1',
      },
    } as any);

    prismaMock.publicExamQuestion.updateMany.mockResolvedValue({ count: 3 } as any);
    prismaMock.publicExamSubject.update.mockResolvedValue({
      id: 'sub-1',
      name: 'Matemática e Lógica',
    } as any);

    await service.updateSubject(
      { subjectId: 'sub-1', newName: 'Matemática e Lógica', minQuestions: 0.2, maxQuestions: 0.4 },
      'user-1',
    );

    expect(prismaMock.publicExamQuestion.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        OR: [
          { subjectId: 'sub-1' },
          { subjectId: null, publicExamName: 'Concurso ABC', subject: 'Matemática' },
        ],
      },
      data: { subject: 'Matemática e Lógica' },
    });
  });

  // Behaviour 5: updateSubject() does NOT call updateMany when name is unchanged
  it('updateSubject() does NOT call updateMany when the name is unchanged', async () => {
    prismaMock.publicExamSubject.findUnique.mockResolvedValue({
      id: 'sub-1',
      name: 'Matemática',
      publicExamId: 'exam-1',
      minQuestions: 0.2,
      maxQuestions: 0.4,
      publicExam: {
        id: 'exam-1',
        name: 'Concurso ABC',
        userId: 'user-1',
      },
    } as any);

    prismaMock.publicExamSubject.update.mockResolvedValue({
      id: 'sub-1',
      name: 'Matemática',
    } as any);

    await service.updateSubject(
      { subjectId: 'sub-1', newName: 'Matemática', minQuestions: 0.2, maxQuestions: 0.4 },
      'user-1',
    );

    expect(prismaMock.publicExamQuestion.updateMany).not.toHaveBeenCalled();
  });

  // Behaviour 6: deleteSubject() throws 403 on ownership mismatch
  it('deleteSubject() throws 403 when the requesting user does not own the subject', async () => {
    prismaMock.publicExamSubject.findUnique.mockResolvedValue({
      id: 'sub-1',
      name: 'Matemática',
      publicExamId: 'exam-1',
      minQuestions: 0.2,
      maxQuestions: 0.4,
      publicExam: {
        id: 'exam-1',
        name: 'Concurso ABC',
        userId: 'other-user',
      },
    } as any);

    await expect(service.deleteSubject('sub-1', 'user-1')).rejects.toMatchObject({ status: 403 });
  });

  // Behaviour 7: updatePublicExamMeta() mirrors exam name onto PublicExamQuestion snapshots
  it('updatePublicExamMeta() calls updateMany to mirror the exam rename onto PublicExamQuestion snapshots', async () => {
    prismaMock.publicExam.findUnique.mockResolvedValue({
      id: 'exam-1',
      name: 'Concurso ABC',
      userId: 'user-1',
      examBoardId: 'board-1',
    } as any);

    prismaMock.publicExamQuestion.updateMany.mockResolvedValue({ count: 5 } as any);
    prismaMock.publicExam.update.mockResolvedValue({
      id: 'exam-1',
      name: 'Concurso XYZ',
      examBoard: { id: 'board-1', name: 'CESGRANRIO', fullName: null },
      subjects: [],
    } as any);

    await service.updatePublicExamMeta('exam-1', { newName: 'Concurso XYZ' }, 'user-1');

    expect(prismaMock.publicExamQuestion.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        OR: [
          { publicExamId: 'exam-1' },
          { publicExamId: null, publicExamName: 'Concurso ABC' },
        ],
      },
      data: { publicExamName: 'Concurso XYZ' },
    });
  });
});
