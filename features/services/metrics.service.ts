import { prisma } from '@/lib/prisma';

export class MetricsService {
  async recordStep(
    logId: string,
    step: 'research' | 'review' | 'format',
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
