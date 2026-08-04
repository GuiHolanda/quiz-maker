import { vi, describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../__mocks__/prisma';

const { openAICallMock, quotaConstructorMock } = vi.hoisted(() => {
  const defaultInstance = {
    checkAndRecordQuestions: vi.fn().mockResolvedValue({ logId: 'log-1' }),
    rollbackQuota: vi.fn().mockResolvedValue(undefined),
  };
  return {
    openAICallMock: vi.fn().mockResolvedValue({
      text: '{"questions":[{"id":1,"text":"Q1","options":{"A":"opt"}}]}',
      inputTokens: 10,
      outputTokens: 20,
    }),
    quotaConstructorMock: vi.fn().mockImplementation(function () {
      return defaultInstance;
    }),
  };
});

vi.mock('@/features/services/openAI.service', () => ({
  OpenAIService: class {
    call = openAICallMock;
  },
}));

vi.mock('@/features/services/exam-question.service', () => ({
  validateAiQuestions: vi.fn().mockReturnValue([{ id: 1, text: 'Q1' }]),
  CertificationQuestionService: vi.fn(),
  PublicExamQuestionService: vi.fn(),
}));

vi.mock('@/features/services/quota.service', () => ({
  QuotaService: quotaConstructorMock,
}));

// after() executa o callback de forma síncrona nos testes para não vazar promises.
vi.mock('next/server', () => ({
  after: (fn: () => void) => {
    // Descarta a função para evitar encadeamento recursivo de processTopic nos testes.
    void fn;
  },
}));

vi.mock('@/config/constants', () => ({
  GENERATION_MAX_CONCURRENT_TOPICS: 10,
  GENERATION_MAX_TOPICS_PER_USER: 5,
}));

import { claimSlots, processTopic, claimGlobalSlotsAndDispatch, extractJson, sanitizeError } from '@/features/services/generation-job.service';

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

const makePublicExamTopic = (overrides = {}) => ({
  id: 'topic-pe-1',
  jobId: 'job-pe-1',
  topicName: 'Direito Administrativo',
  questionCount: 5,
  status: 'running',
  savedCount: 0,
  errorMessage: null,
  pendingQuestionsJson: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  job: {
    id: 'job-pe-1',
    userId: 'user-1',
    type: 'public_exam',
    refName: 'TRF 1ª Região 2024',
    examBoardName: 'FCC',
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

  it('retorna [] quando findMany não encontra candidatos queued', async () => {
    prismaMock.generationJobTopic.count
      .mockResolvedValueOnce(0) // globalRunning
      .mockResolvedValueOnce(0); // userRunning
    prismaMock.generationJobTopic.findMany.mockResolvedValue([]);

    const promoted = await claimSlots('user-1');

    expect(promoted).toEqual([]);
    expect(prismaMock.generationJobTopic.updateMany).not.toHaveBeenCalled();
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
    prismaMock.examSection.findFirst.mockResolvedValue(null);
    prismaMock.usageLogStep.create.mockResolvedValue({} as any);
    prismaMock.usageLog.update.mockResolvedValue({} as any);
  });

  it('armazena pendingQuestionsJson com savedCount 0 ao concluir o tópico', async () => {
    await processTopic('topic-1');

    expect(prismaMock.generationJobTopic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'topic-1' },
        data: expect.objectContaining({ status: 'done', savedCount: 0, pendingQuestionsJson: expect.any(String) }),
      }),
    );

    // MetricsService side effects
    expect(prismaMock.usageLogStep.create).toHaveBeenCalledTimes(3);
    expect(prismaMock.usageLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: expect.any(String) }),
        data: { totalDurationMs: expect.any(Number) },
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

  it('marca o tópico como error com errorType generation quando o pipeline lança', async () => {
    const { validateAiQuestions } = await import('@/features/services/exam-question.service');
    (validateAiQuestions as any).mockImplementationOnce(() => {
      throw new Error('bad json');
    });

    await processTopic('topic-1');

    expect(prismaMock.generationJobTopic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'topic-1' },
        data: expect.objectContaining({
          status: 'error',
          errorMessage: 'Erro na geração de questões',
          errorType: 'generation',
        }),
      }),
    );
  });

  it('faz rollback da quota quando a geração falha após o débito', async () => {
    const rollbackMock = vi.fn().mockResolvedValue(undefined);
    quotaConstructorMock.mockImplementationOnce(function () {
      return {
        checkAndRecordQuestions: vi.fn().mockResolvedValue({ logId: 'log-rb' }),
        rollbackQuota: rollbackMock,
      };
    });
    const { validateAiQuestions } = await import('@/features/services/exam-question.service');
    (validateAiQuestions as any).mockImplementationOnce(() => {
      throw new Error('bad json');
    });

    await processTopic('topic-1');

    expect(rollbackMock).toHaveBeenCalledWith('log-rb');
  });

  it('marca tópico como error quando quota está excedida (checkAndRecordQuestions lança)', async () => {
    quotaConstructorMock.mockImplementationOnce(function () {
      return {
        checkAndRecordQuestions: vi.fn().mockRejectedValue(
          Object.assign(new Error('Quota exceeded'), { status: 402 })
        ),
      };
    });

    await processTopic('topic-1');

    expect(prismaMock.generationJobTopic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'topic-1' },
        data: expect.objectContaining({ status: 'error', errorMessage: 'Limite de quota atingido', errorType: 'quota' }),
      }),
    );
  });

  it('retorna silenciosamente quando findUnique retorna null (job deletado durante processamento)', async () => {
    prismaMock.generationJobTopic.findUnique.mockResolvedValueOnce(null);

    await expect(processTopic('topic-inexistente')).resolves.toBeUndefined();
    expect(prismaMock.generationJobTopic.update).not.toHaveBeenCalled();
  });

  it('atualiza updatedAt (heartbeat) sem finalizar quando ainda há tópicos pendentes', async () => {
    prismaMock.generationJobTopic.count.mockResolvedValue(2);

    await processTopic('topic-1');

    expect(prismaMock.generationJob.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'awaiting_review' }) }),
    );
    expect(prismaMock.generationJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'job-1' }, data: { updatedAt: expect.any(Date) } }),
    );
  });
});

describe('processTopic — branch public_exam', () => {
  beforeEach(() => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.generationJobTopic.findUnique.mockResolvedValue(
      makePublicExamTopic() as any,
    );
    prismaMock.generationJobTopic.update.mockResolvedValue(makePublicExamTopic() as any);
    prismaMock.generationJob.update.mockResolvedValue({} as any);
    prismaMock.generationJob.updateMany.mockResolvedValue({ count: 0 } as any);
    prismaMock.generationJobTopic.updateMany.mockResolvedValue({ count: 0 } as any);
    prismaMock.generationJobTopic.count.mockResolvedValue(0);
    prismaMock.generationJobTopic.findMany.mockResolvedValue([]);
    prismaMock.examSection.findFirst.mockResolvedValue(null);
    prismaMock.usageLogStep.create.mockResolvedValue({} as any);
    prismaMock.usageLog.update.mockResolvedValue({} as any);
  });

  it('chama openAIService.call com os campos corretos de public_exam', async () => {
    await processTopic('topic-pe-1');

    expect(openAICallMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        public_exam_name: 'TRF 1ª Região 2024',
        exam_board_name: 'FCC',
        subject_name: 'Direito Administrativo',
        num_questions: '5',
      }),
      expect.objectContaining({ webSearch: true }),
    );
  });

  it('armazena pendingQuestionsJson ao concluir tópico de concurso', async () => {
    await processTopic('topic-pe-1');

    expect(prismaMock.generationJobTopic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'topic-pe-1' },
        data: expect.objectContaining({ status: 'done', savedCount: 0, pendingQuestionsJson: expect.any(String) }),
      }),
    );
  });

  it('marca tópico de concurso como error quando o pipeline lança', async () => {
    const { validateAiQuestions } = await import('@/features/services/exam-question.service');
    (validateAiQuestions as any).mockImplementationOnce(() => {
      throw new Error('bad public exam json');
    });

    await processTopic('topic-pe-1');

    expect(prismaMock.generationJobTopic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'topic-pe-1' },
        data: expect.objectContaining({ status: 'error', errorMessage: 'Erro na geração de questões', errorType: 'generation' }),
      }),
    );
  });
});

describe('claimGlobalSlots — cross-user slot management (via claimGlobalSlotsAndDispatch)', () => {
  beforeEach(() => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
  });

  it('não promove nada quando o teto global está cheio', async () => {
    // GENERATION_MAX_CONCURRENT_TOPICS is mocked as 10 at the top of the file
    prismaMock.generationJobTopic.count.mockResolvedValueOnce(10); // globalRunning = teto

    await claimGlobalSlotsAndDispatch();

    expect(prismaMock.generationJobTopic.updateMany).not.toHaveBeenCalled();
  });

  it('não promove nada quando não há candidatos queued', async () => {
    prismaMock.generationJobTopic.count.mockResolvedValueOnce(0); // globalRunning
    prismaMock.generationJobTopic.findMany.mockResolvedValue([]); // sem candidatos

    await claimGlobalSlotsAndDispatch();

    expect(prismaMock.generationJobTopic.updateMany).not.toHaveBeenCalled();
  });

  it('promove candidatos de múltiplos usuários respeitando o teto por usuário', async () => {
    // 8 rodando globalmente — 2 slots livres
    // claimGlobalSlots reads globalRunning, then does findMany (take: slots*4 = 8),
    // then reads userRunning per unique userId in the candidates
    prismaMock.generationJobTopic.count
      .mockResolvedValueOnce(8)  // globalRunning → 2 slots
      .mockResolvedValueOnce(0)  // userRunning for user-A
      .mockResolvedValueOnce(0); // userRunning for user-B

    // One candidate per user so each fills one of the 2 available slots
    prismaMock.generationJobTopic.findMany.mockResolvedValue([
      { id: 'tA1', jobId: 'jobA', job: { userId: 'user-A' } },
      { id: 'tB1', jobId: 'jobB', job: { userId: 'user-B' } },
    ] as any);
    prismaMock.generationJobTopic.updateMany.mockResolvedValue({ count: 2 } as any);
    prismaMock.generationJob.updateMany.mockResolvedValue({ count: 2 } as any);

    await claimGlobalSlotsAndDispatch();

    // Both candidates are promoted — each fills one of the 2 global slots
    expect(prismaMock.generationJobTopic.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ['tA1', 'tB1'] } }),
        data: { status: 'running' },
      }),
    );
    // Jobs should also be transitioned from queued → running
    expect(prismaMock.generationJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: expect.arrayContaining(['jobA', 'jobB']) }, status: 'queued' }),
        data: { status: 'running' },
      }),
    );
  });

  it('não promove quando o usuário único já atingiu o teto individual', async () => {
    // 3 slots livres globalmente, but user-A already has 5 running (= GENERATION_MAX_TOPICS_PER_USER)
    prismaMock.generationJobTopic.count.mockResolvedValueOnce(7); // globalRunning → 3 slots

    // Primeiro findMany: candidatos queued. Segundo findMany: tópicos running (5 do user-A = teto).
    prismaMock.generationJobTopic.findMany
      .mockResolvedValueOnce([
        { id: 'tA1', jobId: 'jobA', job: { userId: 'user-A' } },
        { id: 'tA2', jobId: 'jobA', job: { userId: 'user-A' } },
      ] as any)
      .mockResolvedValueOnce([
        { job: { userId: 'user-A' } },
        { job: { userId: 'user-A' } },
        { job: { userId: 'user-A' } },
        { job: { userId: 'user-A' } },
        { job: { userId: 'user-A' } },
      ] as any);

    await claimGlobalSlotsAndDispatch();

    expect(prismaMock.generationJobTopic.updateMany).not.toHaveBeenCalled();
  });
});

describe('extractJson — parse defensivo da resposta da LLM', () => {
  it('extrai o conteúdo de um fenced code block ```json```', () => {
    const raw = 'Some preamble\n```json\n{"questions":[]}\n```\nSome postamble';
    expect(extractJson(raw)).toBe('{"questions":[]}');
  });

  it('extrai o conteúdo de um fenced code block sem linguagem', () => {
    const raw = '```\n{"questions":[]}\n```';
    expect(extractJson(raw)).toBe('{"questions":[]}');
  });

  it('extrai a substring {…} quando não há fenced block', () => {
    const raw = 'Here is the answer: {"questions":[{"id":1}]} done';
    expect(extractJson(raw)).toBe('{"questions":[{"id":1}]}');
  });

  it('retorna o texto trimado quando não há {} nem fenced block', () => {
    const raw = '  plain text without braces  ';
    expect(extractJson(raw)).toBe('plain text without braces');
  });

  it('prefere o fenced block quando há ambos fenced e {…} no texto', () => {
    const raw = 'extra {"x":1} ```json\n{"questions":[]}\n```';
    expect(extractJson(raw)).toBe('{"questions":[]}');
  });
});

describe('sanitizeError — categorização de erro', () => {
  it('classifica quota', () => {
    expect(sanitizeError(new Error('Question generation limit reached (250/period)'))).toEqual({
      message: 'Limite de quota atingido',
      errorType: 'quota',
    });
  });

  it('classifica timeout', () => {
    expect(sanitizeError(new Error('Request timeout ECONNABORTED'))).toEqual({
      message: 'Tempo limite de geração excedido',
      errorType: 'timeout',
    });
  });

  it('classifica 429 como timeout/rate-limit', () => {
    expect(sanitizeError(Object.assign(new Error('rate limited'), { status: 429 }))).toEqual({
      message: 'Limite de requisições da IA atingido',
      errorType: 'timeout',
    });
  });

  it('classifica erro de banco (Prisma-like com code) como generation sem vazar detalhes', () => {
    const prismaLike = Object.assign(new Error('Invalid `prisma.x` invocation'), { code: 'P2002' });
    expect(sanitizeError(prismaLike)).toEqual({
      message: 'Erro interno ao gerar questões',
      errorType: 'generation',
    });
  });

  it('classifica erro genérico como generation', () => {
    expect(sanitizeError(new Error('bad json'))).toEqual({
      message: 'Erro na geração de questões',
      errorType: 'generation',
    });
  });

  it('trata valores não-Error como generation', () => {
    expect(sanitizeError('boom')).toEqual({
      message: 'Erro na geração de questões',
      errorType: 'generation',
    });
  });
});
