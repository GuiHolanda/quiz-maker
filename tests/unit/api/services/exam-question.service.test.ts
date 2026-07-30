import { prismaMock } from '../__mocks__/prisma';
import { ExamQuestionService } from '@/features/services/exam-question.service';

describe('ExamQuestionService', () => {
  it('saveAnswers upserts an ExamAnswer per question', async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.examAnswer.upsert.mockResolvedValue({ id: 1 } as any);
    const service = new ExamQuestionService(prismaMock as any);
    await service.saveAnswers([{ questionId: 1, correctOptions: ['A'], explanations: {} } as any]);
    expect(prismaMock.examAnswer.upsert).toHaveBeenCalled();
  });

  it('saveExplanations createMany with answerId', async () => {
    prismaMock.examExplanation.createMany.mockResolvedValue({ count: 1 } as any);
    const service = new ExamQuestionService(prismaMock as any);
    await service.saveExplanations(5, { A: 'ok' });
    expect(prismaMock.examExplanation.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: [{ answerId: 5, label: 'A', text: 'ok' }] }),
    );
  });
});
