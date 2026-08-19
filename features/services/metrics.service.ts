import { prisma } from '@/lib/prisma';
import type { QuotaAction } from '@/shared/types';

type MetricsStep =
  | 'research'
  | 'review'
  | 'format'
  | 'extract'
  | 'chat'
  | 'identify'
  | 'config_research'
  | 'config_review'
  | 'config_format';

export class MetricsService {
  // count defaults to 1 (one billable unit of `action`). The auto-config identify call
  // passes 0: its tokens are still tracked via UsageLogStep, but it isn't itself a
  // billable auto_config unit — that happens once, when the job is created.
  async createLog(userId: string, action: QuotaAction, count = 1): Promise<string> {
    const log = await prisma.usageLog.create({
      data: { userId, action, count },
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
