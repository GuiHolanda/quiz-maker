import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../__mocks__/prisma';
import { CertificationSimuladosService } from '@/app/api/certification-simulados/certification-simulados.service';

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

      const result = await service.list('user1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].certKey).toBe('AWS-SAA');
      expect(result[0].totalQuestions).toBe(10);
      expect(result[0].attemptCount).toBe(0);
      expect(result[0].bestScore).toBeNull();
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

    it('creates attempt when simulado belongs to user', async () => {
      prismaMock.certificationSimulado.findFirst.mockResolvedValue({ id: 1 } as any);
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
    });
  });

  describe('finishAttempt', () => {
    it('throws 404 when attempt not found', async () => {
      prismaMock.certificationSimuladoAttempt.findFirst.mockResolvedValue(null);

      await expect(service.finishAttempt(1, 99, 'user1', [], 0)).rejects.toMatchObject({ status: 404 });
    });

    it('persists answers and score via $transaction', async () => {
      prismaMock.certificationSimuladoAttempt.findFirst.mockResolvedValue({ id: 5 } as any);
      prismaMock.$transaction.mockResolvedValue([undefined, undefined] as any);

      await service.finishAttempt(1, 5, 'user1', [{ simuladoQuestionId: 10, selectedOptions: ['A'] }], 1);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('create — validateTopicAvailability', () => {
    it('throws 422 when topic has insufficient questions', async () => {
      prismaMock.question.count.mockResolvedValue(2);

      await expect(
        service.create(
          { certKey: 'AWS-SAA', topics: [{ topicName: 'IAM', questionCount: 5 }] },
          'user1'
        )
      ).rejects.toMatchObject({ status: 422 });
    });
  });
});
