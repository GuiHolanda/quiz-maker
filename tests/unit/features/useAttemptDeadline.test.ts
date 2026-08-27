import { computeTimerState } from '@/features/hooks/useAttemptDeadline.hook';

describe('computeTimerState', () => {
  const start = new Date('2026-08-27T10:00:00Z').getTime();

  it('disabled when durationMinutes is null', () => {
    expect(computeTimerState(start, null, start + 1000)).toEqual({ enabled: false, remainingMs: 0, expired: false });
  });

  it('counts down while inside the window', () => {
    const s = computeTimerState(start, 60, start + 10 * 60_000);
    expect(s).toMatchObject({ enabled: true, expired: false });
    expect(s.remainingMs).toBe(50 * 60_000);
  });

  it('expired and clamped to zero once the deadline passes', () => {
    expect(computeTimerState(start, 60, start + 61 * 60_000)).toEqual({ enabled: true, remainingMs: 0, expired: true });
  });
});
