import { prismaMock } from '../__mocks__/prisma';
import { MetricsService } from '@/features/services/metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  describe('recordStep', () => {
    it('creates a UsageLogStep row with the correct fields', async () => {
      prismaMock.usageLogStep.create.mockResolvedValue({} as any);

      await service.recordStep('log-1', 'research', { inputTokens: 100, outputTokens: 200 }, 3500);

      expect(prismaMock.usageLogStep.create).toHaveBeenCalledWith({
        data: {
          usageLogId: 'log-1',
          step: 'research',
          inputTokens: 100,
          outputTokens: 200,
          durationMs: 3500,
        },
      });
    });

    it('creates a step row for each valid step name', async () => {
      prismaMock.usageLogStep.create.mockResolvedValue({} as any);

      await service.recordStep('log-1', 'review', { inputTokens: 50, outputTokens: 80 }, 2000);
      await service.recordStep('log-1', 'format', { inputTokens: 10, outputTokens: 20 }, 500);

      expect(prismaMock.usageLogStep.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.usageLogStep.create).toHaveBeenNthCalledWith(1, {
        data: { usageLogId: 'log-1', step: 'review', inputTokens: 50, outputTokens: 80, durationMs: 2000 },
      });
      expect(prismaMock.usageLogStep.create).toHaveBeenNthCalledWith(2, {
        data: { usageLogId: 'log-1', step: 'format', inputTokens: 10, outputTokens: 20, durationMs: 500 },
      });
    });
  });

  describe('finalize', () => {
    it('updates UsageLog.totalDurationMs with the provided value', async () => {
      prismaMock.usageLog.update.mockResolvedValue({} as any);

      await service.finalize('log-1', 12000);

      expect(prismaMock.usageLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: { totalDurationMs: 12000 },
      });
    });
  });
});
