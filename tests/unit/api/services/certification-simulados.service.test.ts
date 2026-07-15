import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../__mocks__/prisma';
import { CertificationSimuladosService } from '@/app/api/certification-simulados/certification-simulados.service';

const openAICallMock = vi.fn();

vi.mock('@/features/services/openAI.service', () => ({
  OpenAIService: class {
    call = openAICallMock;
  },
}));

const service = new CertificationSimuladosService();

describe('CertificationSimuladosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('returns mapped list items for a user', async () => {
      prismaMock.certificationSimulado.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'My Simulado',
          certKey: 'AWS-SAA',
          userId: 'user1',
          createdAt: new Date('2026-01-01'),
          topics: [],
          attempts: [],
          _count: { questions: 10 },
        },
      ] as any);
      prismaMock.certification.findMany.mockResolvedValue([
        { key: 'AWS-SAA', label: 'AWS Solutions Architect Associate' },
      ] as any);

      const result = await service.list('user1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].certKey).toBe('AWS-SAA');
      expect(result[0].certLabel).toBe('AWS Solutions Architect Associate');
      expect(result[0].totalQuestions).toBe(10);
      expect(result[0].attemptCount).toBe(0);
      expect(result[0].bestScore).toBeNull();
      expect(result[0].openAttemptId).toBeNull();
    });

    it('falls back to certKey when certification row is missing', async () => {
      prismaMock.certificationSimulado.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'My Simulado',
          certKey: 'orphan-key',
          userId: 'user1',
          createdAt: new Date('2026-01-01'),
          topics: [],
          attempts: [],
          _count: { questions: 0 },
        },
      ] as any);
      prismaMock.certification.findMany.mockResolvedValue([] as any);

      const result = await service.list('user1');

      expect(result[0].certLabel).toBe('orphan-key');
    });

    it('separates finished attempts from an open one and exposes openAttemptId', async () => {
      prismaMock.certificationSimulado.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'My Simulado',
          certKey: 'AWS-SAA',
          userId: 'user1',
          createdAt: new Date('2026-01-01'),
          topics: [],
          attempts: [
            {
              id: 42,
              score: null,
              startedAt: new Date('2026-01-03'),
              finishedAt: null,
            },
            {
              id: 40,
              score: 8,
              startedAt: new Date('2026-01-02'),
              finishedAt: new Date('2026-01-02T10:00:00Z'),
            },
            {
              id: 39,
              score: 6,
              startedAt: new Date('2026-01-01'),
              finishedAt: new Date('2026-01-01T10:00:00Z'),
            },
          ],
          _count: { questions: 10 },
        },
      ] as any);
      prismaMock.certification.findMany.mockResolvedValue([
        { key: 'AWS-SAA', label: 'AWS Solutions Architect Associate' },
      ] as any);

      const result = await service.list('user1');

      expect(result[0].attemptCount).toBe(2);
      expect(result[0].bestScore).toBe(8);
      expect(result[0].openAttemptId).toBe(42);
      expect(result[0].lastAttemptId).toBe(40);
      expect(result[0].attempts.map((a: { id: number }) => a.id)).toEqual([40, 39]);
    });
  });

  describe('delete', () => {
    it('throws 404 when simulado not found', async () => {
      prismaMock.certificationSimulado.findFirst.mockResolvedValue(null);

      await expect(service.delete(999, 'user1')).rejects.toMatchObject({ status: 404 });
    });

    it('deletes when ownership confirmed', async () => {
      prismaMock.certificationSimulado.findFirst.mockResolvedValue({ id: 1 } as any);
      prismaMock.certificationSimulado.delete.mockResolvedValue({} as any);

      await expect(service.delete(1, 'user1')).resolves.toBeUndefined();
      expect(prismaMock.certificationSimulado.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('startAttempt', () => {
    it('throws 404 when simulado not found for user', async () => {
      prismaMock.certificationSimulado.findFirst.mockResolvedValue(null);

      await expect(service.startAttempt(1, 'user1')).rejects.toMatchObject({ status: 404 });
    });

    it('creates attempt when simulado belongs to user and there is no open attempt', async () => {
      prismaMock.certificationSimulado.findFirst.mockResolvedValue({ id: 1 } as any);
      prismaMock.certificationSimuladoAttempt.findFirst.mockResolvedValue(null);
      prismaMock.certificationSimuladoAttempt.create.mockResolvedValue({
        id: 5,
        simuladoId: 1,
        userId: 'user1',
        startedAt: new Date(),
        finishedAt: null,
        score: null,
      } as any);

      const attempt = await service.startAttempt(1, 'user1');

      expect(attempt.id).toBe(5);
      expect(prismaMock.certificationSimuladoAttempt.create).toHaveBeenCalled();
    });

    it('reuses the open attempt when one already exists', async () => {
      prismaMock.certificationSimulado.findFirst.mockResolvedValue({ id: 1 } as any);
      prismaMock.certificationSimuladoAttempt.findFirst.mockResolvedValue({
        id: 42,
        simuladoId: 1,
        userId: 'user1',
        startedAt: new Date(),
        finishedAt: null,
        score: null,
      } as any);

      const attempt = await service.startAttempt(1, 'user1');

      expect(attempt.id).toBe(42);
      expect(prismaMock.certificationSimuladoAttempt.create).not.toHaveBeenCalled();
    });
  });

  describe('finishAttempt', () => {
    it('throws 404 when attempt not found', async () => {
      prismaMock.certificationSimuladoAttempt.findFirst.mockResolvedValue(null);
      prismaMock.certificationSimuladoQuestion.findMany.mockResolvedValue([]);

      await expect(service.finishAttempt(1, 99, 'user1', [])).rejects.toMatchObject({ status: 404 });
    });

    it('persists answers and server-calculated score via $transaction', async () => {
      prismaMock.certificationSimuladoAttempt.findFirst.mockResolvedValue({ id: 5 } as any);
      prismaMock.certificationSimuladoQuestion.findMany.mockResolvedValue([
        {
          id: 10,
          question: {
            answer: { correctOptions: ['A'] },
          },
        },
      ] as any);
      prismaMock.$transaction.mockResolvedValue([undefined, undefined] as any);

      await service.finishAttempt(1, 5, 'user1', [{ simuladoQuestionId: 10, selectedOptions: ['A'] }]);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('create — validateTopicAvailability', () => {
    it('throws 404 when certKey does not resolve to a certification', async () => {
      prismaMock.certification.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          { certKey: 'unknown-key', topics: [{ topicName: 'IAM', questionCount: 5 }] },
          'user1'
        )
      ).rejects.toMatchObject({ status: 404 });
    });

    it('throws 422 when topic has insufficient questions', async () => {
      prismaMock.certification.findFirst.mockResolvedValue({ label: 'AWS Solutions Architect' } as any);
      prismaMock.question.count.mockResolvedValue(2);

      await expect(
        service.create(
          { certKey: 'AWS-SAA', topics: [{ topicName: 'IAM', questionCount: 5 }] },
          'user1'
        )
      ).rejects.toMatchObject({ status: 422 });
    });

    it('queries questions by the resolved certification label, not the key', async () => {
      prismaMock.certification.findFirst.mockResolvedValue({ label: 'AWS Solutions Architect' } as any);
      prismaMock.question.count.mockResolvedValue(2);

      await service
        .create({ certKey: 'AWS-SAA', topics: [{ topicName: 'IAM', questionCount: 5 }] }, 'user1')
        .catch(() => {
          /* expected to throw, we only care about the query that ran */
        });

      expect(prismaMock.question.count).toHaveBeenCalledWith({
        where: { userId: 'user1', certificationTitle: 'AWS Solutions Architect', topic: 'IAM' },
      });
    });
  });

  describe('ensureAnswers', () => {
    it('throws 404 when simulado not found', async () => {
      prismaMock.certificationSimulado.findFirst.mockResolvedValue(null);

      await expect(service.ensureAnswers(999, 'user1')).rejects.toMatchObject({ status: 404 });
    });

    it('returns generated:0 when every question already has an answer (idempotent)', async () => {
      prismaMock.certificationSimulado.findFirst.mockResolvedValue({
        id: 1,
        certKey: 'AWS-SAA',
        questions: [
          {
            question: {
              id: 100,
              topic: 'IAM',
              text: 'Q1',
              correctCount: 1,
              options: [{ label: 'A', text: 'opt' }],
              answer: { id: 9, correctOptions: ['A'] },
            },
          },
        ],
      } as any);
      prismaMock.certification.findFirst.mockResolvedValue({ label: 'AWS Solutions Architect' } as any);

      const result = await service.ensureAnswers(1, 'user1');

      expect(result).toEqual({ generated: 0 });
      expect(openAICallMock).not.toHaveBeenCalled();
    });

    it('calls OpenAI and persists answers for missing questions, grouped by topic', async () => {
      prismaMock.certificationSimulado.findFirst.mockResolvedValue({
        id: 1,
        certKey: 'AWS-SAA',
        questions: [
          {
            question: {
              id: 100,
              topic: 'IAM',
              text: 'Q1',
              correctCount: 1,
              options: [{ label: 'A', text: 'opt-a' }],
              answer: null,
            },
          },
          {
            question: {
              id: 101,
              topic: 'IAM',
              text: 'Q2',
              correctCount: 1,
              options: [{ label: 'A', text: 'opt-a' }],
              answer: null,
            },
          },
          {
            question: {
              id: 200,
              topic: 'EC2',
              text: 'Q3',
              correctCount: 1,
              options: [{ label: 'A', text: 'opt-a' }],
              answer: null,
            },
          },
        ],
      } as any);
      prismaMock.certification.findFirst.mockResolvedValue({ label: 'AWS Solutions Architect' } as any);

      openAICallMock
        .mockResolvedValueOnce({
          text: JSON.stringify({
            answers: [
              { questionId: 100, correctOptions: ['A'] },
              { questionId: 101, correctOptions: ['B'] },
            ],
          }),
          inputTokens: 0,
          outputTokens: 0,
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({
            answers: [{ questionId: 200, correctOptions: ['C'] }],
          }),
          inputTokens: 0,
          outputTokens: 0,
        });

      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));

      const result = await service.ensureAnswers(1, 'user1');

      expect(result.generated).toBe(3);
      expect(openAICallMock).toHaveBeenCalledTimes(2);
      // Verify each LLM call carried the resolved cert label, not the key.
      const calls = openAICallMock.mock.calls;
      const inputs = calls.map((c: any[]) => c[1]);

      expect(inputs.every((i: any) => i.certification_name === 'AWS Solutions Architect')).toBe(true);
      // Both topics were dispatched.
      const topics = new Set(inputs.map((i: any) => i.topic));

      expect(topics.has('IAM')).toBe(true);
      expect(topics.has('EC2')).toBe(true);
    });

    it('skips only the questions that already have an answer', async () => {
      prismaMock.certificationSimulado.findFirst.mockResolvedValue({
        id: 1,
        certKey: 'AWS-SAA',
        questions: [
          {
            question: {
              id: 100,
              topic: 'IAM',
              text: 'Q1',
              correctCount: 1,
              options: [{ label: 'A', text: 'opt' }],
              answer: { id: 9, correctOptions: ['A'] }, // already has answer — skip
            },
          },
          {
            question: {
              id: 101,
              topic: 'IAM',
              text: 'Q2',
              correctCount: 1,
              options: [{ label: 'A', text: 'opt' }],
              answer: null, // missing — generate
            },
          },
        ],
      } as any);
      prismaMock.certification.findFirst.mockResolvedValue({ label: 'AWS Solutions Architect' } as any);

      openAICallMock.mockResolvedValueOnce({
        text: JSON.stringify({ answers: [{ questionId: 101, correctOptions: ['A'] }] }),
        inputTokens: 0,
        outputTokens: 0,
      });
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));

      const result = await service.ensureAnswers(1, 'user1');

      expect(result.generated).toBe(1);
      const callPayload = openAICallMock.mock.calls[0][1];
      const questionsArg = JSON.parse(callPayload.questions) as Array<{ id: number }>;

      expect(questionsArg.map((q) => q.id)).toEqual([101]);
    });

    it('falls back to certKey as label when certification cannot be resolved', async () => {
      prismaMock.certificationSimulado.findFirst.mockResolvedValue({
        id: 1,
        certKey: 'orphan-key',
        questions: [
          {
            question: {
              id: 100,
              topic: 'IAM',
              text: 'Q1',
              correctCount: 1,
              options: [{ label: 'A', text: 'opt' }],
              answer: null,
            },
          },
        ],
      } as any);
      prismaMock.certification.findFirst.mockResolvedValue(null);

      openAICallMock.mockResolvedValueOnce({
        text: JSON.stringify({ answers: [{ questionId: 100, correctOptions: ['A'] }] }),
        inputTokens: 0,
        outputTokens: 0,
      });
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));

      const result = await service.ensureAnswers(1, 'user1');

      expect(result.generated).toBe(1);
      expect(openAICallMock.mock.calls[0][1].certification_name).toBe('orphan-key');
    });
  });
});
