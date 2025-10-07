export function parseNumber(value: string | null, fallback: number | null = null) {
  if (value === null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function safeJsonParse<T = unknown>(
  s: string
): { ok: boolean; error: string | null; value: T | null } {
  try {
    return { ok: true, error: null, value: JSON.parse(s) as T };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err), value: null };
  }
}
