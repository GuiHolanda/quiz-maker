import { prismaMock } from '../__mocks__/prisma';
import { QuotaService } from '@/features/services/quota.service';

const DAY_MS = 1000 * 60 * 60 * 24;

function makeUser(overrides: Partial<{
  id: string;
  plan: string;
  questionsGeneratedThisPeriod: number;
  autoConfigThisPeriod: number;
  aiChatMessagesThisPeriod: number;
  periodStartDate: Date;
  customQuotaOverride: number | null;
  bonusQuestions: number;
  sprintExpiresAt: Date | null;
}> = {}) {
  return {
    id: 'user-1',
    plan: 'free',
    questionsGeneratedThisPeriod: 0,
    autoConfigThisPeriod: 0,
    aiChatMessagesThisPeriod: 0,
    periodStartDate: new Date(Date.now() - 1 * DAY_MS), // 1 day ago — within period
    customQuotaOverride: null,
    bonusQuestions: 0,
    sprintExpiresAt: null,
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
      makeUser({ plan: 'free', questionsGeneratedThisPeriod: 40 }),
    );

    await expect(service.check('user-1', 'generate_questions', 10)).resolves.toBeUndefined();
  });

  // Behaviour 2: check generate_questions throws 403 when limit exceeded
  it('check generate_questions throws 403 when limit is exceeded (free plan, used=100, count=1)', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ plan: 'free', questionsGeneratedThisPeriod: 100 }),
    );

    const promise = service.check('user-1', 'generate_questions', 1);

    await expect(promise).rejects.toMatchObject({
      status: 403,
      body: { error: 'quota_exceeded', code: 'questions_limit' },
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
      body: { error: 'quota_exceeded', code: 'questions_limit' },
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
          autoConfigThisPeriod: 0,
          aiChatMessagesThisPeriod: 0,
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

    // `code` is what the client keys the limit modal off — a wrong or missing one sends
    // the user a generic error instead of the exam-cap explanation.
    await expect(promise).rejects.toMatchObject({
      status: 403,
      body: { error: 'quota_exceeded', code: 'exam_limit', limit: 2, used: 2, plan: 'free' },
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
      aiChatUsed: 0,
      aiChatLimit: -1,
      autoConfigLimit: -1,
      periodStartDate: periodStart.toISOString(),
    });
  });

  // Behaviour 8b: getUsage resolves sprint plan's limits (mirrors pro_ai) and surfaces its expiry
  it('getUsage resolves sprint plan limits and surfaces sprintExpiresAt', async () => {
    const expiresAt = new Date(Date.now() + 45 * DAY_MS);

    prismaMock.user.findUniqueOrThrow.mockResolvedValue(
      makeUser({ plan: 'sprint', questionsGeneratedThisPeriod: 500, sprintExpiresAt: expiresAt }),
    );
    prismaMock.exam.count.mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    prismaMock.examQuestion.count.mockResolvedValue(0);

    const usage = await service.getUsage('user-1');

    // sprint mirrors pro_ai: 2000 questions, 12 exams, 300 AI Chat messages — see PLAN_LIMITS.
    expect(usage).toMatchObject({
      plan: 'sprint',
      questionsUsed: 500,
      questionsLimit: 2000,
      examsLimit: 12,
      aiChatUsed: 0,
      aiChatLimit: 300,
      autoConfigLimit: 30,
      sprintExpiresAt: expiresAt.toISOString(),
    });
  });

  describe('checkAndRecordQuestions (atomic quota enforcement)', () => {
    // Behaviour 9: checkAndRecordQuestions performs atomic updateMany for finite limit
    it('checkAndRecordQuestions succeeds when used + count <= limit (atomic updateMany)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', questionsGeneratedThisPeriod: 40 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.usageLog.create.mockResolvedValue({ id: 'log-1' } as any);

      await expect(service.checkAndRecordQuestions('user-1', 10)).resolves.toMatchObject({ logId: 'log-1' });

      expect(prismaMock.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'user-1', questionsGeneratedThisPeriod: { lte: 90 } }),
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
        body: { error: 'quota_exceeded', code: 'questions_limit' },
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

  describe('checkAndRecordAutoConfig', () => {
    it('throws 403 for free plan (autoConfigPerPeriod = 0)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', autoConfigThisPeriod: 0 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

      const promise = service.checkAndRecordAutoConfig('user-1');

      await expect(promise).rejects.toMatchObject({
        status: 403,
        body: { error: 'quota_exceeded', code: 'auto_config_limit', limit: 0 },
      });
    });

    it('succeeds for pro plan under the period limit (atomic updateMany)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'pro', autoConfigThisPeriod: 3 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.usageLog.create.mockResolvedValue({ id: 'log-auto-1' } as any);

      await expect(service.checkAndRecordAutoConfig('user-1')).resolves.toMatchObject({ logId: 'log-auto-1' });

      expect(prismaMock.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'user-1', autoConfigThisPeriod: { lte: 14 } }),
          data: { autoConfigThisPeriod: { increment: 1 } },
        }),
      );
      expect(prismaMock.usageLog.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', action: 'auto_config', count: 1 },
      });
    });

    it('throws 403 for pro plan when the period limit is already reached', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'pro', autoConfigThisPeriod: 15 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

      const promise = service.checkAndRecordAutoConfig('user-1');

      await expect(promise).rejects.toMatchObject({
        status: 403,
        body: { error: 'quota_exceeded', code: 'auto_config_limit', limit: 15, used: 15 },
      });
    });

    it('uses direct increment for unlimited plans (tester)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'tester', autoConfigThisPeriod: 999 }),
      );
      prismaMock.user.update.mockResolvedValue({} as any);
      prismaMock.usageLog.create.mockResolvedValue({ id: 'log-auto-2' } as any);

      await expect(service.checkAndRecordAutoConfig('user-1')).resolves.toMatchObject({ logId: 'log-auto-2' });

      expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { autoConfigThisPeriod: { increment: 1 } },
      });
    });
  });

  // achado 15 of the pricing tier audit: AI Chat was metered but never capped.
  describe('checkAndRecordAiChatMessage', () => {
    it('throws 403 for pro plan (aiChatMessagesPerPeriod = 0 — plan_required gates the route before this is reached)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'pro', aiChatMessagesThisPeriod: 0 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

      const promise = service.checkAndRecordAiChatMessage('user-1');

      await expect(promise).rejects.toMatchObject({
        status: 403,
        body: { error: 'quota_exceeded', code: 'ai_chat_limit', limit: 0 },
      });
    });

    it('succeeds for pro_ai plan under the period limit (atomic updateMany)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'pro_ai', aiChatMessagesThisPeriod: 299 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.usageLog.create.mockResolvedValue({ id: 'log-chat-1' } as any);

      await expect(service.checkAndRecordAiChatMessage('user-1')).resolves.toMatchObject({ logId: 'log-chat-1' });

      expect(prismaMock.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'user-1', aiChatMessagesThisPeriod: { lte: 299 } }),
          data: { aiChatMessagesThisPeriod: { increment: 1 } },
        }),
      );
      expect(prismaMock.usageLog.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', action: 'ai_chat', count: 1 },
      });
    });

    it('throws 403 for pro_ai plan once the 300/period cap is reached', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'pro_ai', aiChatMessagesThisPeriod: 300 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

      const promise = service.checkAndRecordAiChatMessage('user-1');

      await expect(promise).rejects.toMatchObject({
        status: 403,
        body: { error: 'quota_exceeded', code: 'ai_chat_limit', limit: 300, used: 300, plan: 'pro_ai' },
      });
    });

    it('sprint plan gets the same 300/period cap as pro_ai', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'sprint', aiChatMessagesThisPeriod: 300 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.checkAndRecordAiChatMessage('user-1')).rejects.toMatchObject({
        body: { code: 'ai_chat_limit', limit: 300 },
      });
    });

    it('uses direct increment for unlimited plans (admin)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'admin', aiChatMessagesThisPeriod: 9999 }),
      );
      prismaMock.user.update.mockResolvedValue({} as any);
      prismaMock.usageLog.create.mockResolvedValue({ id: 'log-chat-2' } as any);

      await expect(service.checkAndRecordAiChatMessage('user-1')).resolves.toMatchObject({ logId: 'log-chat-2' });

      expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { aiChatMessagesThisPeriod: { increment: 1 } },
      });
    });
  });

  describe('checkAutoConfigAvailable', () => {
    it('throws 403 for free plan (autoConfigPerPeriod = 0) without recording anything', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(makeUser({ plan: 'free', autoConfigThisPeriod: 0 }));

      await expect(service.checkAutoConfigAvailable('user-1')).rejects.toMatchObject({
        status: 403,
        body: { error: 'quota_exceeded', code: 'auto_config_limit', limit: 0 },
      });
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
      expect(prismaMock.usageLog.create).not.toHaveBeenCalled();
    });

    it('resolves for pro plan under the period limit', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(makeUser({ plan: 'pro', autoConfigThisPeriod: 3 }));

      await expect(service.checkAutoConfigAvailable('user-1')).resolves.toBeUndefined();
    });

    it('throws 403 for pro plan when the period limit is already reached', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(makeUser({ plan: 'pro', autoConfigThisPeriod: 15 }));

      await expect(service.checkAutoConfigAvailable('user-1')).rejects.toMatchObject({
        status: 403,
        body: { error: 'quota_exceeded', code: 'auto_config_limit', limit: 15, used: 15 },
      });
    });

    it('resolves for unlimited plans (tester)', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(makeUser({ plan: 'tester', autoConfigThisPeriod: 999 }));

      await expect(service.checkAutoConfigAvailable('user-1')).resolves.toBeUndefined();
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

    it('decrements autoConfigThisPeriod for an auto_config log', async () => {
      prismaMock.usageLog.findUnique.mockResolvedValue({
        id: 'log-2',
        userId: 'user-1',
        count: 1,
        action: 'auto_config',
      } as any);
      prismaMock.user.update.mockResolvedValue({} as any);
      prismaMock.usageLog.delete.mockResolvedValue({} as any);

      const service = new QuotaService();
      await service.rollbackQuota('log-2');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { autoConfigThisPeriod: { decrement: 1 } },
      });
      expect(prismaMock.usageLog.delete).toHaveBeenCalledWith({ where: { id: 'log-2' } });
    });

    it('decrements aiChatMessagesThisPeriod for an ai_chat log', async () => {
      prismaMock.usageLog.findUnique.mockResolvedValue({
        id: 'log-chat-3',
        userId: 'user-1',
        count: 1,
        action: 'ai_chat',
      } as any);
      prismaMock.user.update.mockResolvedValue({} as any);
      prismaMock.usageLog.delete.mockResolvedValue({} as any);

      const service = new QuotaService();
      await service.rollbackQuota('log-chat-3');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { aiChatMessagesThisPeriod: { decrement: 1 } },
      });
      expect(prismaMock.usageLog.delete).toHaveBeenCalledWith({ where: { id: 'log-chat-3' } });
    });
  });

  // Regression coverage for achado 10 of the pricing tier audit: bonusQuestions used to
  // have no dedicated field, so any bonus grant had to go through customQuotaOverride —
  // which *replaces* the plan limit instead of adding to it, silently wiping the bonus
  // the moment an admin set an override or the user upgraded plans.
  describe('bonusQuestions (additive quota)', () => {
    it('getUsage adds bonusQuestions on top of the plan limit', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', questionsGeneratedThisPeriod: 200, bonusQuestions: 100 }),
      );
      prismaMock.exam.count.mockResolvedValue(0);
      prismaMock.examQuestion.count.mockResolvedValue(0);

      const usage = await service.getUsage('user-1');

      // free plan default is 100 — with +100 bonus the effective ceiling is 200.
      expect(usage.questionsLimit).toBe(200);
    });

    it('getUsage adds bonusQuestions on top of a customQuotaOverride, not instead of it', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', customQuotaOverride: 500, bonusQuestions: 100 }),
      );
      prismaMock.exam.count.mockResolvedValue(0);
      prismaMock.examQuestion.count.mockResolvedValue(0);

      const usage = await service.getUsage('user-1');

      expect(usage.questionsLimit).toBe(600);
    });

    it('bonusQuestions has no effect once customQuotaOverride is the -1 infinity sentinel', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', customQuotaOverride: -1, bonusQuestions: 100 }),
      );
      prismaMock.exam.count.mockResolvedValue(0);
      prismaMock.examQuestion.count.mockResolvedValue(0);

      const usage = await service.getUsage('user-1');

      expect(usage.questionsLimit).toBe(-1); // -1 is the UI's own unlimited sentinel
    });

    it('checkAndRecordQuestions lets a request overflow into bonusQuestions once the base limit is exhausted', async () => {
      // free plan: base limit 100, used 95, bonus 100 → asking for 10 needs 5 from bonus.
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', questionsGeneratedThisPeriod: 95, bonusQuestions: 100 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.user.update.mockResolvedValue({} as any);
      prismaMock.usageLog.create.mockResolvedValue({ id: 'log-bonus-1' } as any);

      await expect(service.checkAndRecordQuestions('user-1', 10)).resolves.toMatchObject({ logId: 'log-bonus-1' });

      // The atomic gate itself must check against base + bonus (200), not base alone.
      expect(prismaMock.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ questionsGeneratedThisPeriod: { lte: 190 } }) }),
      );
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { bonusQuestions: { decrement: 5 } },
      });
      expect(prismaMock.usageLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ bonusQuestionsConsumed: 5 }),
      });
    });

    it('checkAndRecordQuestions leaves bonusQuestions untouched when the request fits inside the base limit', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', questionsGeneratedThisPeriod: 50, bonusQuestions: 100 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.usageLog.create.mockResolvedValue({ id: 'log-bonus-2' } as any);

      await service.checkAndRecordQuestions('user-1', 10);

      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(prismaMock.usageLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ bonusQuestionsConsumed: 0 }),
      });
    });

    it('checkAndRecordQuestions still throws 403 once base + bonus together are exhausted', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', questionsGeneratedThisPeriod: 100, bonusQuestions: 10 }),
      );
      prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

      const promise = service.checkAndRecordQuestions('user-1', 15);

      await expect(promise).rejects.toMatchObject({
        status: 403,
        body: { error: 'quota_exceeded', code: 'questions_limit', limit: 110 },
      });
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('rollbackQuota restores bonusQuestions by the amount recorded on the log', async () => {
      prismaMock.usageLog.findUnique.mockResolvedValue({
        id: 'log-bonus-3',
        userId: 'user-1',
        count: 10,
        bonusQuestionsConsumed: 5,
      } as any);
      prismaMock.user.update.mockResolvedValue({} as any);
      prismaMock.usageLog.delete.mockResolvedValue({} as any);

      await service.rollbackQuota('log-bonus-3');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          questionsGeneratedThisPeriod: { decrement: 10 },
          bonusQuestions: { increment: 5 },
        },
      });
    });

    it('survives the 30-day period rollover — the reset only touches the period counters', async () => {
      const oldDate = new Date(Date.now() - 31 * DAY_MS);

      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        makeUser({ plan: 'free', questionsGeneratedThisPeriod: 240, periodStartDate: oldDate, bonusQuestions: 100 }),
      );
      prismaMock.user.update.mockResolvedValue(
        makeUser({ plan: 'free', questionsGeneratedThisPeriod: 0, periodStartDate: new Date(), bonusQuestions: 100 }),
      );
      prismaMock.exam.count.mockResolvedValue(0);
      prismaMock.examQuestion.count.mockResolvedValue(0);

      const usage = await service.getUsage('user-1');

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ bonusQuestions: expect.anything() }),
        }),
      );
      expect(usage.questionsUsed).toBe(0);
      expect(usage.questionsLimit).toBe(200); // 100 base + 100 bonus, still there after reset
    });
  });
});
