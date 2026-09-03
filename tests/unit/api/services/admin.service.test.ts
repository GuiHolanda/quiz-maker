import { beforeEach } from 'vitest';

import { prismaMock } from '../__mocks__/prisma';
import { AdminService, ANALYTICS_WINDOW_DAYS, percentile } from '@/app/api/admin/admin.service';

// Regression coverage for the P90-consumo column added to /admin/analytics (pricing tier
// audit, semana 2-3): the break-even comparison is only meaningful if the underlying
// nearest-rank percentile math is correct at its edges.
describe('percentile', () => {
  it('returns 0 for an empty array', () => {
    expect(percentile([], 90)).toBe(0);
  });

  it('returns the single value regardless of requested percentile', () => {
    expect(percentile([42], 50)).toBe(42);
    expect(percentile([42], 90)).toBe(42);
  });

  it('computes p50/p90/p100 via nearest-rank on a sorted array', () => {
    const sorted = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    expect(percentile(sorted, 50)).toBe(50);
    expect(percentile(sorted, 90)).toBe(90);
    expect(percentile(sorted, 100)).toBe(100);
  });

  it('never indexes past the end of the array', () => {
    expect(percentile([5, 15], 100)).toBe(15);
  });

  it('assumes the input is already sorted ascending — does not sort internally', () => {
    // Guards the call site's contract: callers must sort before calling.
    expect(percentile([100, 10], 50)).toBe(100);
  });
});

describe('AdminService.getOverview — janela de analytics', () => {
  beforeEach(() => {
    prismaMock.user.findMany.mockResolvedValue([] as never);
    prismaMock.usageLog.aggregate.mockResolvedValue({ _sum: { count: 0 } } as never);
    prismaMock.usageLogStep.aggregate.mockResolvedValue({
      _sum: { inputTokens: 0, outputTokens: 0 },
    } as never);
    (prismaMock.usageLogStep.groupBy as any).mockResolvedValue([]);
    (prismaMock.usageLog.groupBy as any).mockResolvedValue([]);
    prismaMock.usageLog.findMany.mockResolvedValue([] as never);
  });

  function windowStartOf(where: any): Date | undefined {
    return where?.createdAt?.gte ?? where?.usageLog?.createdAt?.gte;
  }

  it('limita toda leitura de uso à janela, para nenhum groupBy varrer a tabela inteira', async () => {
    const before = Date.now();

    await new AdminService().getOverview();

    const usageQueries = [
      ...prismaMock.usageLog.aggregate.mock.calls,
      ...(prismaMock.usageLog.groupBy as any).mock.calls,
      ...prismaMock.usageLogStep.aggregate.mock.calls,
      ...(prismaMock.usageLogStep.groupBy as any).mock.calls,
    ].map(([args]: any) => args);

    expect(usageQueries.length).toBe(6);

    const expected = before - ANALYTICS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    for (const query of usageQueries) {
      const start = windowStartOf(query.where);
      expect(start).toBeInstanceOf(Date);
      expect(Math.abs(start!.getTime() - expected)).toBeLessThan(5000);
    }
  });

  it('mantém o recorte de generate_questions junto da janela, sem substituí-lo', async () => {
    await new AdminService().getOverview();

    const actions = prismaMock.usageLog.aggregate.mock.calls.map(([args]: any) => args.where.action);
    expect(actions).toContain('generate_questions');
  });

  it('reporta a janela usada para a UI poder rotular os números', async () => {
    const stats = await new AdminService().getOverview();

    expect(stats.analyticsWindowDays).toBe(ANALYTICS_WINDOW_DAYS);
  });
});
