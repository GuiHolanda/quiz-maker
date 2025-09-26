export function parseNumber(value: string | null, fallback: number | null = null) {
  if (value === null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function safeJsonParse<T = unknown>(
  s: string
): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(s) as T };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
