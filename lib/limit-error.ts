import type { LimitCode } from '@/shared/types';

export interface LimitError {
  readonly code: LimitCode;
  readonly limit?: number;
  readonly used?: number;
  readonly plan?: string;
}

const KNOWN_CODES: readonly LimitCode[] = ['questions_limit', 'exam_limit', 'auto_config_limit', 'plan_required'];

interface ErrorPayload {
  readonly code?: unknown;
  readonly error?: unknown;
  readonly limit?: unknown;
  readonly used?: unknown;
  readonly plan?: unknown;
}

// Reads the structured 403 body the API attaches (see lib/api-error.ts → quotaDetail and
// the plan_required responses) and turns it into a named limit the UI can act on. Returns
// null for anything else so callers keep their normal error handling — a network blip or a
// 500 must never be reported to the user as "you hit your plan limit".
//
// Pure and axios-agnostic (no React imports) so it stays importable from a plain .test.ts.
export function parseLimitError(err: unknown): LimitError | null {
  const status =
    (err as { response?: { status?: number }; status?: number })?.response?.status ??
    (err as { status?: number })?.status;

  if (status !== 403) return null;

  const payload: ErrorPayload =
    (err as { response?: { data?: ErrorPayload } })?.response?.data ?? (err as ErrorPayload) ?? {};

  // `code` is the modern field; `error` carried the discriminator before quota codes existed.
  const raw = typeof payload.code === 'string' ? payload.code : payload.error;
  const code = KNOWN_CODES.find((known) => known === raw);

  // Not every 403 is a limit: the exam/browse services return a bare "Forbidden" for
  // ownership violations. Naming those as a limit would push an upgrade that buys the
  // user nothing, so an unrecognised 403 falls through to normal error handling.
  if (!code) return null;

  return {
    code,
    ...(typeof payload.limit === 'number' && { limit: payload.limit }),
    ...(typeof payload.used === 'number' && { used: payload.used }),
    ...(typeof payload.plan === 'string' && { plan: payload.plan }),
  };
}
