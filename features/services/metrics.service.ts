import { prisma } from '@/lib/prisma';
import type { QuotaAction } from '@/shared/types';

type MetricsStep = 'research' | 'review' | 'format' | 'extract' | 'chat';

export class MetricsService {
  async createLog(userId: string, action: QuotaAction): Promise<string> {
    const log = await prisma.usageLog.create({
      data: { userId, action, count: 1 },
    });
    return log.id;
  }

  async recordStep(
    logId: string,
    step: MetricsStep,
    tokens: { inputTokens: number; outputTokens: number },
    durationMs: number
  ): Promise<void> {
    await prisma.usageLogStep.create({
      data: {
        usageLogId: logId,
        step,
        inputTokens: tokens.inputTokens,
        outputTokens: tokens.outputTokens,
        durationMs,
      },
    });
  }

  async finalize(logId: string, totalDurationMs: number): Promise<void> {
    await prisma.usageLog.update({
      where: { id: logId },
      data: { totalDurationMs },
    });
  }
}
