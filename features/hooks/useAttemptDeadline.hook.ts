'use client';

import { useEffect, useRef, useState } from 'react';

export function computeTimerState(startedAtMs: number, durationMinutes: number | null, nowMs: number) {
  if (durationMinutes == null) return { enabled: false, remainingMs: 0, expired: false };
  const deadline = startedAtMs + durationMinutes * 60_000;
  const remainingMs = Math.max(0, deadline - nowMs);
  return { enabled: true, remainingMs, expired: remainingMs === 0 };
}

export function shouldFireExpiry(state: { enabled: boolean; expired: boolean }, alreadyFired: boolean): boolean {
  return state.enabled && state.expired && !alreadyFired;
}

function formatMMSS(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface UseAttemptDeadlineArgs {
  readonly startedAt: string | null;
  readonly durationMinutes: number | null;
  readonly onExpire: () => void;
  readonly nowOffsetMs?: number;
}

export function useAttemptDeadline({ startedAt, durationMinutes, onExpire, nowOffsetMs = 0 }: UseAttemptDeadlineArgs) {
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  const startedAtMs = startedAt ? new Date(startedAt).getTime() : null;
  const effectiveNow = now - nowOffsetMs;
  const state =
    startedAtMs != null
      ? computeTimerState(startedAtMs, durationMinutes, effectiveNow)
      : { enabled: false, remainingMs: 0, expired: false };
  const elapsedMs = startedAtMs != null ? Math.max(0, effectiveNow - startedAtMs) : 0;

  useEffect(() => {
    if (startedAtMs == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAtMs]);

  useEffect(() => {
    if (shouldFireExpiry(state, firedRef.current)) {
      firedRef.current = true;
      onExpireRef.current();
    }
  }, [state.enabled, state.expired]);

  return {
    enabled: state.enabled,
    remainingMs: state.remainingMs,
    elapsedMs,
    label: formatMMSS(state.remainingMs),
  };
}
