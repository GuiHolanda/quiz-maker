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

describe('createFromPayload — pool attachment', () => {
  it('sets poolId when a matching QuestionPool entry exists for the exam context', async () => {
    const exam = {
      id: 'exam-1',
      userId: 'user-1',
      type: 'certification',
      name: 'AWS SAA',
      providerId: 'provider-1',
      examBoardId: null,
      sections: [
        {
          id: 'section-1',
          name: 'Cloud Architecture',
          topics: [{ id: 'topic-1', name: 'VPC' }],
        },
      ],
    };
    const pool = { id: 'pool-1' };

    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.exam.findFirst.mockResolvedValue(exam as any);
    prismaMock.questionPool.findFirst.mockResolvedValue(pool as any);
    prismaMock.examQuestion.create.mockResolvedValue({ id: 1 } as any);
    prismaMock.examOption.create.mockResolvedValue({} as any);

    const service = new ExamQuestionService(prismaMock as any);
    await service.createFromPayload(
      [
        {
          id: 1,
          examName: 'AWS SAA',
          sectionName: 'Cloud Architecture',
          topic: 'VPC',
          text: 'Q?',
          correctCount: 1,
          difficulty: 'medium',
          options: { A: 'opt A' },
        },
      ],
      'user-1',
      'exam-1',
    );

    expect(prismaMock.examQuestion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ poolId: 'pool-1' }) }),
    );
  });

  it('leaves poolId null when no pool entry exists', async () => {
    const exam = {
      id: 'exam-1',
      userId: 'user-1',
      type: 'certification',
      name: 'AWS SAA',
      providerId: 'provider-1',
      examBoardId: null,
      sections: [{ id: 'section-1', name: 'Security', topics: [] }],
    };

    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.exam.findFirst.mockResolvedValue(exam as any);
    prismaMock.questionPool.findFirst.mockResolvedValue(null);
    prismaMock.examQuestion.create.mockResolvedValue({ id: 2 } as any);
    prismaMock.examOption.create.mockResolvedValue({} as any);

    const service = new ExamQuestionService(prismaMock as any);
    await service.createFromPayload(
      [{ id: 1, examName: 'AWS SAA', sectionName: 'Security', text: 'Q?', correctCount: 1, difficulty: 'easy', options: { A: 'A' } }],
      'user-1',
      'exam-1',
    );

    expect(prismaMock.examQuestion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ poolId: null }) }),
    );
  });
});
