import { computeTimerState, shouldFireExpiry } from '@/features/hooks/useAttemptDeadline.hook';

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

describe('shouldFireExpiry — ticking a mounted attempt', () => {
  const start = new Date('2026-08-27T10:00:00Z').getTime();

  function runTicker(startedAtMs: number, durationMinutes: number | null) {
    const onExpire = vi.fn();
    let alreadyFired = false;

    const tick = () => {
      const state = computeTimerState(startedAtMs, durationMinutes, Date.now());

      if (shouldFireExpiry(state, alreadyFired)) {
        alreadyFired = true;
        onExpire();
      }
    };

    return { onExpire, tick };
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires exactly once when the deadline passes while mounted', () => {
    vi.setSystemTime(start);
    const { onExpire, tick } = runTicker(start, 1);

    tick();
    for (let second = 0; second < 59; second += 1) {
      vi.advanceTimersByTime(1000);
      tick();
    }
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    tick();
    expect(onExpire).toHaveBeenCalledTimes(1);

    for (let second = 0; second < 10; second += 1) {
      vi.advanceTimersByTime(1000);
      tick();
    }
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('fires once on mount when the deadline is already in the past', () => {
    vi.setSystemTime(start + 90 * 60_000);
    const { onExpire, tick } = runTicker(start, 60);

    tick();
    expect(onExpire).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    tick();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('never fires for a livre attempt with no duration', () => {
    vi.setSystemTime(start + 90 * 60_000);
    const { onExpire, tick } = runTicker(start, null);

    tick();
    expect(onExpire).not.toHaveBeenCalled();
  });
});
