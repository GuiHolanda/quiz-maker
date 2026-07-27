import { vi, describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../__mocks__/prisma';

vi.mock('@/features/services/openAI.service', () => ({
  OpenAIService: class {
    call = vi
      .fn()
      .mockResolvedValue({ text: '{"questions":[{"id":1,"text":"Q1","options":{"A":"opt"}}]}', inputTokens: 10, outputTokens: 20 });
  },
}));

vi.mock('@/features/services/question.service', () => ({
  validateAiQuestions: vi.fn().mockReturnValue([{ id: 1, text: 'Q1' }]),
  CertificationQuestionService: vi.fn(),
  PublicExamQuestionService: vi.fn(),
}));

vi.mock('@/features/services/quota.service', () => ({
  QuotaService: class {
    checkAndRecordQuestions = vi.fn().mockResolvedValue({ logId: 'log-1' });
    recordTokens = vi.fn().mockResolvedValue(undefined);
  },
}));

// after() executa o callback de forma síncrona nos testes para não vazar promises.
vi.mock('next/server', () => ({
  after: (fn: () => void) => {
    // Não encadeia recursivamente — só registra que foi chamado.
    void fn;
  },
}));

vi.mock('@/config/constants', () => ({
  GENERATION_MAX_CONCURRENT_TOPICS: 10,
  GENERATION_MAX_TOPICS_PER_USER: 5,
}));

import { claimSlots, processTopic } from '@/features/services/generation-job.service';

const makeTopic = (overrides = {}) => ({
  id: 'topic-1',
  jobId: 'job-1',
  topicName: 'S3',
  questionCount: 5,
  status: 'running',
  savedCount: 0,
  errorMessage: null,
  pendingQuestionsJson: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  job: {
    id: 'job-1',
    userId: 'user-1',
    type: 'certification',
    refName: 'AWS SAA-C03',
    examBoardName: null,
  },
  ...overrides,
});

describe('claimSlots — respeita tetos global e por usuário', () => {
  beforeEach(() => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
  });

  it('promove até o teto por usuário quando há folga global', async () => {
    // 0 rodando global, 0 do usuário → pode promover até 5 (teto por usuário)
    prismaMock.generationJobTopic.count
      .mockResolvedValueOnce(0) // globalRunning
      .mockResolvedValueOnce(0); // userRunning
    prismaMock.generationJobTopic.findMany.mockResolvedValue([
      { id: 't1', jobId: 'job-1' },
      { id: 't2', jobId: 'job-1' },
    ] as any);
    prismaMock.generationJobTopic.updateMany.mockResolvedValue({ count: 2 } as any);
    prismaMock.generationJob.updateMany.mockResolvedValue({ count: 1 } as any);

    const promoted = await claimSlots('user-1');

    expect(promoted).toEqual(['t1', 't2']);
    // take deve ser min(10-0, 5-0) = 5
    expect(prismaMock.generationJobTopic.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5, where: { status: 'queued', job: { userId: 'user-1' } } }),
    );
  });

  it('não promove nada quando o usuário já atingiu o teto individual', async () => {
    prismaMock.generationJobTopic.count
      .mockResolvedValueOnce(5) // globalRunning
      .mockResolvedValueOnce(5); // userRunning (no teto)

    const promoted = await claimSlots('user-1');

    expect(promoted).toEqual([]);
    expect(prismaMock.generationJobTopic.findMany).not.toHaveBeenCalled();
  });

  it('limita pelo teto global quando ele é menor que o teto por usuário', async () => {
    // 8 rodando global (folga 2), 0 do usuário (folga 5) → min = 2
    prismaMock.generationJobTopic.count
      .mockResolvedValueOnce(8) // globalRunning
      .mockResolvedValueOnce(0); // userRunning
    prismaMock.generationJobTopic.findMany.mockResolvedValue([{ id: 't1', jobId: 'job-1' }] as any);
    prismaMock.generationJobTopic.updateMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.generationJob.updateMany.mockResolvedValue({ count: 1 } as any);

    await claimSlots('user-1');

    expect(prismaMock.generationJobTopic.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 2 }));
  });
});

describe('processTopic — pipeline e finalização', () => {
  beforeEach(() => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.generationJobTopic.findUnique.mockResolvedValue(makeTopic() as any);
    prismaMock.generationJobTopic.update.mockResolvedValue(makeTopic() as any);
    prismaMock.generationJob.update.mockResolvedValue({} as any);
    prismaMock.generationJob.updateMany.mockResolvedValue({ count: 0 } as any);
    prismaMock.generationJobTopic.updateMany.mockResolvedValue({ count: 0 } as any);
    prismaMock.generationJobTopic.count.mockResolvedValue(0);
    prismaMock.generationJobTopic.findMany.mockResolvedValue([]);
  });

  it('armazena pendingQuestionsJson com savedCount 0 ao concluir o tópico', async () => {
    await processTopic('topic-1');

    expect(prismaMock.generationJobTopic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'topic-1' },
        data: expect.objectContaining({ status: 'done', savedCount: 0, pendingQuestionsJson: expect.any(String) }),
      }),
    );
  });

  it('marca o job como awaiting_review quando não restam tópicos pendentes', async () => {
    // maybeFinalizeJob conta 0 tópicos pendentes → finaliza
    prismaMock.generationJobTopic.count.mockResolvedValue(0);

    await processTopic('topic-1');

    expect(prismaMock.generationJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'job-1' }, data: { status: 'awaiting_review' } }),
    );
  });

  it('marca o tópico como error quando o pipeline lança', async () => {
    const { validateAiQuestions } = await import('@/features/services/question.service');
    (validateAiQuestions as any).mockImplementationOnce(() => {
      throw new Error('bad json');
    });

    await processTopic('topic-1');

    expect(prismaMock.generationJobTopic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'topic-1' },
        data: expect.objectContaining({ status: 'error', errorMessage: expect.stringContaining('bad json') }),
      }),
    );
  });
});
