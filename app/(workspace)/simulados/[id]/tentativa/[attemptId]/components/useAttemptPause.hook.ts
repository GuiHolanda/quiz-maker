'use client';

import { useCallback, useEffect, useState } from 'react';

import { SIMULADO_ATTEMPT_PAUSE_KEY } from '@/config/constants';

export interface PauseState {
  pausedMs: number;
  pausedAt: number | null;
}

const EMPTY: PauseState = { pausedMs: 0, pausedAt: null };

export function computePauseOffset(state: PauseState, now: number): number {
  return state.pausedAt != null ? state.pausedMs + (now - state.pausedAt) : state.pausedMs;
}

export function togglePauseState(state: PauseState, now: number): PauseState {
  return state.pausedAt != null
    ? { pausedMs: state.pausedMs + (now - state.pausedAt), pausedAt: null }
    : { pausedMs: state.pausedMs, pausedAt: now };
}

function read(attemptId: number): PauseState {
  try {
    const stored = localStorage.getItem(SIMULADO_ATTEMPT_PAUSE_KEY(attemptId));
    if (!stored) return EMPTY;
    const parsed = JSON.parse(stored) as PauseState;
    return { pausedMs: Number(parsed.pausedMs) || 0, pausedAt: parsed.pausedAt ?? null };
  } catch {
    return EMPTY;
  }
}

function write(attemptId: number, state: PauseState) {
  try {
    localStorage.setItem(SIMULADO_ATTEMPT_PAUSE_KEY(attemptId), JSON.stringify(state));
  } catch {
    /* storage unavailable — pause degrades to wall-clock */
  }
}

export function useAttemptPause(attemptId: number) {
  const [state, setState] = useState<PauseState>(EMPTY);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setState(read(attemptId));
  }, [attemptId]);

  const paused = state.pausedAt != null;

  useEffect(() => {
    if (!paused) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const pauseOffsetMs = computePauseOffset(state, now);

  const togglePause = useCallback(() => {
    setNow(Date.now());
    setState((prev) => {
      const next = togglePauseState(prev, Date.now());
      write(attemptId, next);
      return next;
    });
  }, [attemptId]);

  const clearPause = useCallback(() => {
    try {
      localStorage.removeItem(SIMULADO_ATTEMPT_PAUSE_KEY(attemptId));
    } catch {
      /* noop */
    }
    setState(EMPTY);
  }, [attemptId]);

  return { paused, pauseOffsetMs, togglePause, clearPause };
}
