import { prismaMock } from '../__mocks__/prisma';
import { backfillAnswerCorrectness } from '@/prisma/dev/scripts/backfill-mock-exam-answer-correctness';

describe('backfillAnswerCorrectness', () => {
  it('marks isCorrect=true when selected options match the answer key as a set', async () => {
    prismaMock.mockExamAttemptAnswer.findMany.mockResolvedValue([
      { id: 1, selectedOptions: JSON.stringify(['A', 'C']),
        mockExamQuestion: { examQuestion: { answer: { correctOptions: ['C', 'A'] } } } },
    ] as any);
    prismaMock.mockExamAttemptAnswer.update.mockResolvedValue({} as any);

    const res = await backfillAnswerCorrectness(prismaMock as any);

    expect(prismaMock.mockExamAttemptAnswer.update).toHaveBeenCalledWith({
      where: { id: 1 }, data: { isCorrect: true },
    });
    expect(res).toEqual({ updated: 1, indeterminate: 0 });
  });

  it('marks isCorrect=false when the set differs', async () => {
    prismaMock.mockExamAttemptAnswer.findMany.mockResolvedValue([
      { id: 2, selectedOptions: JSON.stringify(['A']),
        mockExamQuestion: { examQuestion: { answer: { correctOptions: ['B'] } } } },
    ] as any);
    prismaMock.mockExamAttemptAnswer.update.mockResolvedValue({} as any);

    await backfillAnswerCorrectness(prismaMock as any);

    expect(prismaMock.mockExamAttemptAnswer.update).toHaveBeenCalledWith({
      where: { id: 2 }, data: { isCorrect: false },
    });
  });

  it('leaves isCorrect=false and counts indeterminate when the answer key is missing', async () => {
    prismaMock.mockExamAttemptAnswer.findMany.mockResolvedValue([
      { id: 3, selectedOptions: JSON.stringify(['A']),
        mockExamQuestion: { examQuestion: { answer: null } } },
    ] as any);
    prismaMock.mockExamAttemptAnswer.update.mockResolvedValue({} as any);

    const res = await backfillAnswerCorrectness(prismaMock as any);

    expect(prismaMock.mockExamAttemptAnswer.update).toHaveBeenCalledWith({
      where: { id: 3 }, data: { isCorrect: false },
    });
    expect(res).toEqual({ updated: 0, indeterminate: 1 });
  });
});
