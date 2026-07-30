import { prismaMock } from '../__mocks__/prisma';
import { QuotaService } from '@/features/services/quota.service';

const DAY_MS = 1000 * 60 * 60 * 24;

function makeUser(overrides: Partial<{
  id: string;
  plan: string;
  questionsGeneratedThisPeriod: number;
  periodStartDate: Date;
  customQuotaOverride: number | null;
}> = {}) {
  return {
    id: 'user-1',
    plan: 'free',
    questionsGeneratedThisPeriod: 0,
    periodStartDate: new Date(Date.now() - 1 * DAY_MS), // 1 day ago — within period
    customQuotaOverride: null,
    ...overrides,
  } as any;
}

describe('QuotaService', () => {
  let service: QuotaService;

  beforeEach(() => {
    service = new QuotaService();
  });

  // Behaviour 1: check generate_questions passes when under limit
  it('check generate_questions passes when questionsGeneratedThisPeriod < limit', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ plan: 'free', questionsGeneratedThisPeriod: 100 }),
    );

    await expect(service.check('user-1', 'generate_questions', 10)).resolves.toBeUndefined();
  });

  // Behaviour 2: check generate_questions throws 403 when limit exceeded
  it('check generate_questions throws 403 when limit is exceeded (free plan, used=250, count=1)', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ plan: 'free', questionsGeneratedThisPeriod: 250 }),
    );

    const promise = service.check('user-1', 'generate_questions', 1);

    await expect(promise).rejects.toMatchObject({
      status: 403,
      body: { error: 'quota_exceeded' },
    });
  });

  // Behaviour 3: check generate_questions passes when customQuotaOverride === -1 (unlimited)
  it('check generate_questions passes when customQuotaOverride === -1 regardless of high usage', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ plan: 'free', questionsGeneratedThisPeriod: 999_999, customQuotaOverride: -1 }),
    );

    await expect(service.check('user-1', 'generate_questions', 100)).resolves.toBeUndefined();
  });

  // Behaviour 4: check generate_questions uses exact customQuotaOverride limit (override=10, used=9, count=2 → throws)
  it('check generate_questions throws when customQuotaOverride=10 and used=9, count=2', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ plan: 'free', questionsGeneratedThisPeriod: 9, customQuotaOverride: 10 }),
    );

    const promise = service.check('user-1', 'generate_questions', 2);

    await expect(promise).rejects.toMatchObject({
      status: 403,
      body: { error: 'quota_exceeded' },
    });
  });

  // Behaviour 5: period reset calls prisma.user.update when periodStartDate is 31+ days ago
  it('check resets the period when periodStartDate is 31+ days ago', async () => {
    const oldDate = new Date(Date.now() - 31 * DAY_MS);
    const resetUser = makeUser({
      plan: 'free',
      questionsGeneratedThisPeriod: 0,
      periodStartDate: new Date(),
    });

    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ plan: 'free', questionsGeneratedThisPeriod: 10, periodStartDate: oldDate }),
    );
    prismaMock.user.update.mockResolvedValue(resetUser);

    await service.check('user-1', 'generate_questions', 1);

    expect(prismaMock.user.update).toHaveBeenCalledOnce();
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          questionsGeneratedThisPeriod: 0,
          periodStartDate: expect.any(Date),
        }),
      }),
    );
  });

  // Behaviour 6: check create_exam throws 403 when maxExams reached (free plan, examCount=2)
  it('check create_exam throws 403 when free plan user has reached maxExams (2)', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ plan: 'free' }),
    );
    prismaMock.exam.count.mockResolvedValue(2);

    const promise = service.check('user-1', 'create_exam', 1);

    await expect(promise).rejects.toMatchObject({
      status: 403,
      body: { error: 'quota_exceeded' },
    });
  });

  // Behaviour 7: check create_exam passes for free plan when under limit (examCount=0)
  it('check create_exam passes for free plan when examCount=0 (limit=2)', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ plan: 'free' }),
    );
    prismaMock.exam.count.mockResolvedValue(0);

    await expect(service.check('user-1', 'create_exam', 1)).resolves.toBeUndefined();
  });

  // Behaviour 8: getUsage returns correct UsageStats — questionsLimit === -1 for tester plan
  it('getUsage returns correct UsageStats with -1 for unlimited fields on tester plan', async () => {
    const periodStart = new Date(Date.now() - 5 * DAY_MS);

    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({
        plan: 'tester',
        questionsGeneratedThisPeriod: 42,
        periodStartDate: periodStart,
        customQuotaOverride: null,
      }),
    );
    // exam.count is called twice: certification then public_exam
    prismaMock.exam.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    prismaMock.examQuestion.count.mockResolvedValue(0);

    const usage = await service.getUsage('user-1');

    expect(usage).toMatchObject({
      plan: 'tester',
      questionsUsed: 42,
      questionsLimit: -1,
      examsUsed: 4,
      examsLimit: -1,
      certificationsUsed: 3,
      publicExamsUsed: 1,
      periodStartDate: periodStart.toISOString(),
    });
  });

  describe('checkAndRecordQuestions (atomic quota enforcement)', () => {
    // Behaviour 9: checkAndRecordQuestions performs atomic updateMany for finite limit
    it('checkAndRecordQuestions succeeds when used + count <= limit (atomic updateMany)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', questionsGeneratedThisPeriod: 100 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.usageLog.create.mockResolvedValue({ id: 'log-1' } as any);

      await expect(service.checkAndRecordQuestions('user-1', 10)).resolves.toMatchObject({ logId: 'log-1' });

      expect(prismaMock.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'user-1', questionsGeneratedThisPeriod: { lte: 240 } }),
          data: { questionsGeneratedThisPeriod: { increment: 10 } },
        }),
      );
    });

    // Behaviour 10: checkAndRecordQuestions throws 403 when updateMany returns count === 0
    it('checkAndRecordQuestions throws 403 when atomic update returns count=0 (quota exceeded)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', questionsGeneratedThisPeriod: 245 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

      const promise = service.checkAndRecordQuestions('user-1', 10);

      await expect(promise).rejects.toMatchObject({
        status: 403,
        body: { error: 'quota_exceeded' },
      });
    });

    // Behaviour 11: checkAndRecordQuestions skips updateMany for infinite limit (tester plan)
    it('checkAndRecordQuestions uses direct increment for unlimited plans (tester)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'tester', questionsGeneratedThisPeriod: 99999, customQuotaOverride: null }),
      );
      prismaMock.user.update.mockResolvedValue({} as any);
      prismaMock.usageLog.create.mockResolvedValue({ id: 'log-2' } as any);

      await expect(service.checkAndRecordQuestions('user-1', 50)).resolves.toMatchObject({ logId: 'log-2' });

      expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { questionsGeneratedThisPeriod: { increment: 50 } },
        }),
      );
    });
  });

  describe('checkAndRecordQuestions — context fields', () => {
    it('stores context fields in UsageLog when provided (unlimited plan)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'tester', customQuotaOverride: -1 }),
      );
      prismaMock.user.update.mockResolvedValue(makeUser() as any);
      prismaMock.usageLog.create.mockResolvedValue({ id: 'log-1' } as any);

      await service.checkAndRecordQuestions('user-1', 5, {
        refName: 'AWS SAA-C03',
        refKey: 'aws-saa-c03',
        type: 'certification',
        topicName: 'S3 Storage Classes',
      });

      expect(prismaMock.usageLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          refName: 'AWS SAA-C03',
          refKey: 'aws-saa-c03',
          type: 'certification',
          topicName: 'S3 Storage Classes',
        }),
      });
    });

    it('stores context fields in UsageLog when provided (finite plan)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', questionsGeneratedThisPeriod: 0 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.usageLog.create.mockResolvedValue({ id: 'log-2' } as any);

      await service.checkAndRecordQuestions('user-1', 5, {
        refName: 'OAB',
        type: 'certification',
        topicName: 'Direito Civil',
      });

      expect(prismaMock.usageLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          refName: 'OAB',
          type: 'certification',
          topicName: 'Direito Civil',
        }),
      });
    });

    it('works without context (backward compatible)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', questionsGeneratedThisPeriod: 0 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.usageLog.create.mockResolvedValue({ id: 'log-3' } as any);

      await expect(service.checkAndRecordQuestions('user-1', 5)).resolves.toEqual({ logId: 'log-3' });
    });
  });

  describe('rollbackQuota', () => {
    it('decrements the period counter and deletes the usage log', async () => {
      prismaMock.usageLog.findUnique.mockResolvedValue({
        id: 'log-1',
        userId: 'user-1',
        count: 5,
      } as any);
      prismaMock.user.update.mockResolvedValue({} as any);
      prismaMock.usageLog.delete.mockResolvedValue({} as any);

      const service = new QuotaService();
      await service.rollbackQuota('log-1');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { questionsGeneratedThisPeriod: { decrement: 5 } },
      });
      expect(prismaMock.usageLog.delete).toHaveBeenCalledWith({ where: { id: 'log-1' } });
    });

    it('is a no-op when the log does not exist', async () => {
      prismaMock.usageLog.findUnique.mockResolvedValue(null);

      const service = new QuotaService();
      await service.rollbackQuota('missing');

      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(prismaMock.usageLog.delete).not.toHaveBeenCalled();
    });
  });
});
