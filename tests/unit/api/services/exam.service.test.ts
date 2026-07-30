import { prismaMock } from '../__mocks__/prisma';
import { ExamService } from '@/features/services/exam.service';

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
});
