import { prismaMock } from '../__mocks__/prisma';
import { CertificationQuestionService, PublicExamQuestionService } from '@/features/services/question.service';

describe('CertificationQuestionService.saveAnswers', () => {
  const service = new CertificationQuestionService(prismaMock as any);

  beforeEach(() => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
  });

  it('uses upsert (not create) so concurrent invocations cannot trigger unique-constraint failures', async () => {
    await service.saveAnswers([{ questionId: 100, correctOptions: ['A'], explanations: {} }]);

    expect(prismaMock.answer.upsert).toHaveBeenCalledWith({
      where: { questionId: 100 },
      create: { questionId: 100, correctOptions: ['A'] },
      update: {},
    });
    expect(prismaMock.answer.create).not.toHaveBeenCalled();
  });

  it('keeps first-writer-wins: update payload is empty so an existing Answer is never overwritten', async () => {
    await service.saveAnswers([{ questionId: 100, correctOptions: ['B'], explanations: {} }]);

    const call = prismaMock.answer.upsert.mock.calls[0][0];

    expect(call.update).toEqual({});
  });

  it('skips entries with empty/invalid correctOptions instead of writing them', async () => {
    await service.saveAnswers([
      { questionId: 100, correctOptions: [], explanations: {} },
      { questionId: 101, correctOptions: ['A'], explanations: {} },
      { questionId: 102, correctOptions: null as unknown as string[], explanations: {} },
    ]);

    expect(prismaMock.answer.upsert).toHaveBeenCalledTimes(1);
    expect(prismaMock.answer.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { questionId: 101 } })
    );
  });

  it('iterates each answer in a single $transaction', async () => {
    await service.saveAnswers([
      { questionId: 1, correctOptions: ['A'], explanations: {} },
      { questionId: 2, correctOptions: ['B'], explanations: {} },
    ]);

    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(prismaMock.answer.upsert).toHaveBeenCalledTimes(2);
  });
});

describe('PublicExamQuestionService.saveAnswers', () => {
  const service = new PublicExamQuestionService(prismaMock as any);

  beforeEach(() => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
  });

  it('uses upsert on publicExamAnswer with empty update (first-writer-wins)', async () => {
    await service.saveAnswers([{ questionId: 200, correctOptions: ['C'], explanations: {} }]);

    expect(prismaMock.publicExamAnswer.upsert).toHaveBeenCalledWith({
      where: { questionId: 200 },
      create: { questionId: 200, correctOptions: ['C'] },
      update: {},
    });
    expect(prismaMock.publicExamAnswer.create).not.toHaveBeenCalled();
  });

  it('skips entries with empty correctOptions', async () => {
    await service.saveAnswers([
      { questionId: 200, correctOptions: [], explanations: {} },
      { questionId: 201, correctOptions: ['A'], explanations: {} },
    ]);

    expect(prismaMock.publicExamAnswer.upsert).toHaveBeenCalledTimes(1);
    expect(prismaMock.publicExamAnswer.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { questionId: 201 } })
    );
  });
});
