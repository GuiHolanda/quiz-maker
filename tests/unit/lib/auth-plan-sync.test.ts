import { prismaMock } from '../api/__mocks__/prisma';
import { syncTokenPlan, PLAN_SYNC_TTL_MS, type PlanToken } from '@/lib/auth-plan-sync';

// The `session` callback trusts whatever this leaves on the token — a token that never
// re-syncs strands an upgraded user on the old plan, and one that syncs every call puts
// the remote DB back on the hot path this was built to clear.

const NOW = 1_700_000_000_000;

function dbUser(plan: string, sprintExpiresAt: Date | null = null) {
  return { plan, sprintExpiresAt } as any;
}

describe('syncTokenPlan', () => {
  it('leaves an anonymous token untouched and never hits the DB', async () => {
    const token = { plan: 'pro' };

    const result = await syncTokenPlan(token, undefined, NOW);

    expect(result).toBe(token);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('seeds the plan on the first sync when the token has none yet', async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser('pro_ai'));

    const token = await syncTokenPlan({ sub: 'user-1' } as PlanToken, undefined, NOW);

    expect(token.plan).toBe('pro_ai');
    expect(token.sprintExpiresAt).toBeNull();
    expect(token.planSyncedAt).toBe(NOW);
  });

  it('skips the DB while the token is within its TTL', async () => {
    const token = { sub: 'user-1', plan: 'pro', sprintExpiresAt: null, planSyncedAt: NOW - PLAN_SYNC_TTL_MS + 1_000 };

    const result = await syncTokenPlan(token, undefined, NOW);

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(result.plan).toBe('pro');
  });

  it('re-syncs once the TTL has elapsed', async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser('free'));

    const token = await syncTokenPlan(
      { sub: 'user-1', plan: 'pro', sprintExpiresAt: null, planSyncedAt: NOW - PLAN_SYNC_TTL_MS - 1 },
      undefined,
      NOW
    );

    expect(prismaMock.user.findUnique).toHaveBeenCalledOnce();
    expect(token.plan).toBe('free');
    expect(token.planSyncedAt).toBe(NOW);
  });

  it('re-syncs on an explicit update() trigger even within the TTL', async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser('pro_ai'));

    const token = await syncTokenPlan(
      { sub: 'user-1', plan: 'free', sprintExpiresAt: null, planSyncedAt: NOW },
      'update',
      NOW
    );

    expect(token.plan).toBe('pro_ai');
  });

  it('downgrades an expired sprint to free and persists the change', async () => {
    const expiry = new Date(NOW - 1_000);

    prismaMock.user.findUnique.mockResolvedValue(dbUser('sprint', expiry));
    prismaMock.user.update.mockResolvedValue(dbUser('free', null));

    const token = await syncTokenPlan(
      { sub: 'user-1', plan: 'sprint', sprintExpiresAt: expiry.getTime(), planSyncedAt: NOW },
      undefined,
      NOW
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { plan: 'free', sprintExpiresAt: null },
      select: { plan: true, sprintExpiresAt: true },
    });
    expect(token.plan).toBe('free');
    expect(token.sprintExpiresAt).toBeNull();
  });

  it('keeps a sprint that is still within its term', async () => {
    const expiry = new Date(NOW + 10 * 24 * 60 * 60 * 1000);

    prismaMock.user.findUnique.mockResolvedValue(dbUser('sprint', expiry));

    const token = await syncTokenPlan({ sub: 'user-1', planSyncedAt: 0 } as PlanToken, undefined, NOW);

    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(token.plan).toBe('sprint');
    expect(token.sprintExpiresAt).toBe(expiry.getTime());
  });

  it('falls back to free when the user row is gone', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const token = await syncTokenPlan({ sub: 'user-1', planSyncedAt: 0 } as PlanToken, undefined, NOW);

    expect(token.plan).toBe('free');
  });
});
