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

  // Behaviour 6: check create_certification throws 403 when maxCertifications reached (free plan, certCount=2)
  it('check create_certification throws 403 when free plan user has reached maxCertifications (2)', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ plan: 'free' }),
    );
    prismaMock.certification.count.mockResolvedValue(2);

    const promise = service.check('user-1', 'create_certification', 1);

    await expect(promise).rejects.toMatchObject({
      status: 403,
      body: { error: 'quota_exceeded' },
    });
  });

  // Behaviour 7: check create_public_exam throws 403 for free plan (limit=0, examCount=0)
  it('check create_public_exam throws 403 for free plan (limit=0) even when examCount=0', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ plan: 'free' }),
    );
    prismaMock.publicExam.count.mockResolvedValue(0);

    const promise = service.check('user-1', 'create_public_exam', 1);

    await expect(promise).rejects.toMatchObject({
      status: 403,
      body: { error: 'quota_exceeded' },
    });
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
    prismaMock.certification.count.mockResolvedValue(3);
    prismaMock.publicExam.count.mockResolvedValue(1);

    const usage = await service.getUsage('user-1');

    expect(usage).toMatchObject({
      plan: 'tester',
      questionsUsed: 42,
      questionsLimit: -1,
      certificationsUsed: 3,
      certificationsLimit: -1,
      publicExamsUsed: 1,
      publicExamsLimit: -1,
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
      prismaMock.usageLog.create.mockResolvedValue({} as any);

      await expect(service.checkAndRecordQuestions('user-1', 10)).resolves.toBeUndefined();

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
      prismaMock.usageLog.create.mockResolvedValue({} as any);

      await expect(service.checkAndRecordQuestions('user-1', 50)).resolves.toBeUndefined();

      expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { questionsGeneratedThisPeriod: { increment: 50 } },
        }),
      );
    });
  });
});
